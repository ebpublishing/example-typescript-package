export async function getProjects(org: string, token: string): Promise<any> {
    const response = await fetch(
      `https://app.terraform.io/api/v2/organizations/${org}/projects`, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    const data = await response.json();
    return data;
}