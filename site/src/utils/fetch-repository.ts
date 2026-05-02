import axios from "axios";

const GITHUB_API = "https://api.github.com";
const HEADERS = {
  "User-Agent": "jayf0x-site",
  Accept: "application/vnd.github+json",
};

export interface GithubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  size: number;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  topics: string[];
  archived: boolean;
  homepage: string | null;
  languages_url: string;
  license: { spdx_id: string; name: string } | null;
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  assets?: ReleaseAsset[];
}

export async function fetchUserRepos(owner: string): Promise<GithubRepo[]> {
  const response = await axios.get<GithubRepo[]>(
    `${GITHUB_API}/users/${encodeURIComponent(owner)}/repos?per_page=100`,
    { headers: HEADERS },
  );
  return response.data.filter((r) => !r.fork && r.size > 0);
}

export async function fetchRepoLanguages(languagesUrl: string): Promise<string[]> {
  const response = await axios.get<Record<string, number>>(languagesUrl, {
    headers: HEADERS,
  });
  return Object.keys(response.data);
}

export async function fetchLatestDmgUrl(
  owner: string,
  repo: string,
): Promise<string> {
  try {
    const response = await axios.get<Release>(
      `${GITHUB_API}/repos/${owner}/${repo}/releases/latest`,
    );
    const dmg = response.data.assets?.find((a) => a.name.endsWith(".dmg"));
    return dmg?.browser_download_url ?? "";
  } catch {
    return "";
  }
}
