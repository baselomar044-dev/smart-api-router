'use server';

import { NextRequest, NextResponse } from 'next/server';

// GitHub API Integration
export async function POST(request: NextRequest) {
  try {
    const { action, token, repoName, files, commitMessage, isPrivate = false } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 400 }
      );
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    };

    switch (action) {
      case 'create-repo': {
        // Create new repository
        const createResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: repoName,
            private: isPrivate,
            auto_init: false,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          return NextResponse.json(
            { error: error.message || 'Failed to create repository' },
            { status: createResponse.status }
          );
        }

        const repo = await createResponse.json();
        return NextResponse.json({
          success: true,
          repoUrl: repo.html_url,
          cloneUrl: repo.clone_url,
          fullName: repo.full_name,
        });
      }

      case 'push': {
        // Get user info
        const userResponse = await fetch('https://api.github.com/user', { headers });
        if (!userResponse.ok) {
          return NextResponse.json({ error: 'Invalid GitHub token' }, { status: 401 });
        }
        const user = await userResponse.json();
        const owner = user.login;

        // Check if repo exists
        const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
        
        let repoFullName = `${owner}/${repoName}`;
        
        if (!repoCheck.ok) {
          // Create repo if doesn't exist
          const createResponse = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: repoName,
              private: isPrivate,
              auto_init: true,
            }),
          });
          
          if (!createResponse.ok) {
            const error = await createResponse.json();
            return NextResponse.json(
              { error: error.message || 'Failed to create repository' },
              { status: createResponse.status }
            );
          }
          
          // Wait for repo to be ready
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Get default branch
        const repoInfo = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
        const repoData = await repoInfo.json();
        const branch = repoData.default_branch || 'main';

        // Get current commit SHA
        let baseSha = null;
        try {
          const refResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/git/ref/heads/${branch}`,
            { headers }
          );
          if (refResponse.ok) {
            const refData = await refResponse.json();
            baseSha = refData.object.sha;
          }
        } catch (e) {
          // New repo, no commits yet
        }

        // Create blobs for all files
        const blobs = await Promise.all(
          files.map(async (file: { path: string; content: string }) => {
            const blobResponse = await fetch(
              `https://api.github.com/repos/${repoFullName}/git/blobs`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  content: Buffer.from(file.content).toString('base64'),
                  encoding: 'base64',
                }),
              }
            );
            const blob = await blobResponse.json();
            return {
              path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
              mode: '100644',
              type: 'blob',
              sha: blob.sha,
            };
          })
        );

        // Create tree
        const treeResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}/git/trees`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              base_tree: baseSha,
              tree: blobs,
            }),
          }
        );
        const tree = await treeResponse.json();

        // Create commit
        const commitResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}/git/commits`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: commitMessage || 'Update from SolveIt',
              tree: tree.sha,
              parents: baseSha ? [baseSha] : [],
            }),
          }
        );
        const commit = await commitResponse.json();

        // Update reference
        const updateRefResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}/git/refs/heads/${branch}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              sha: commit.sha,
              force: true,
            }),
          }
        );

        if (!updateRefResponse.ok) {
          // Try creating the ref if it doesn't exist
          await fetch(
            `https://api.github.com/repos/${repoFullName}/git/refs`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                ref: `refs/heads/${branch}`,
                sha: commit.sha,
              }),
            }
          );
        }

        return NextResponse.json({
          success: true,
          commitSha: commit.sha,
          repoUrl: `https://github.com/${repoFullName}`,
          commitUrl: `https://github.com/${repoFullName}/commit/${commit.sha}`,
        });
      }

      case 'list-repos': {
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers,
        });

        if (!response.ok) {
          return NextResponse.json({ error: 'Failed to list repositories' }, { status: response.status });
        }

        const repos = await response.json();
        return NextResponse.json({
          success: true,
          repos: repos.map((repo: any) => ({
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            private: repo.private,
            updatedAt: repo.updated_at,
          })),
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Git API error:', error);
    return NextResponse.json(
      { error: 'Git operation failed' },
      { status: 500 }
    );
  }
}
