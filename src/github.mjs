// Fetches the public data needed by the cards from the GitHub GraphQL API.
export const QUERY = `query($login: String!) {
  user(login: $login) {
    name login
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions }
    }
    pullRequests { totalCount }
    issues { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
      }
    }
  }
}`;

export async function fetchUser(login, token, fetchImpl = fetch) {
  if (!login) throw new Error('No username given.');
  if (!token) throw new Error('No GitHub token given. Pass the "token" input (defaults to github.token).');
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'green-core-stats',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`GitHub API returned ${res.status} with a non-JSON body.`);
  }
  if (!res.ok || json.errors) {
    const msg = json.errors?.map((e) => e.message).join('; ') || json.message || `HTTP ${res.status}`;
    throw new Error(`GitHub API error: ${msg}`);
  }
  if (!json.data?.user) throw new Error(`User "${login}" was not found.`);
  return json.data.user;
}
