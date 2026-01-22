
import { GitHubConfig, AppData } from '../types';

export const saveToGitHub = async (config: GitHubConfig, data: AppData): Promise<boolean> => {
  if (!config.token || !config.repo || !config.owner) return false;

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
  
  try {
    // 1. Try to get the existing file to get its SHA
    let sha: string | undefined;
    try {
      const getRes = await fetch(url, {
        headers: { Authorization: `token ${config.token}` }
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }
    } catch (e) {
      console.log("File likely doesn't exist yet.");
    }

    // 2. Commit the new data
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Sync App Data - ${new Date().toISOString()}`,
        content,
        sha
      })
    });

    return res.ok;
  } catch (error) {
    console.error("GitHub Sync Error:", error);
    return false;
  }
};

export const fetchFromGitHub = async (config: GitHubConfig): Promise<AppData | null> => {
  if (!config.token || !config.repo || !config.owner) return null;

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `token ${config.token}` }
    });
    
    if (!res.ok) return null;
    
    const fileData = await res.json();
    const content = decodeURIComponent(escape(atob(fileData.content)));
    return JSON.parse(content);
  } catch (error) {
    console.error("GitHub Fetch Error:", error);
    return null;
  }
};
