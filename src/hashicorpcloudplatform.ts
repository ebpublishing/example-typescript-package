type hashicorpCloudPlatformApiArgs = {
      terraform_cloud_org_name: string;
      terraform_cloud_token: string;
};

export type CreateWorkspaceProjectsArgs = hashicorpCloudPlatformApiArgs & {
    terraform_cloud_project_name: string;
    workspaces_to_create: string[];
};

export type GetWorkspaceArgs = hashicorpCloudPlatformApiArgs & {
    workspace_name: string;
};

export type GetWorkspaceVariablesArgs = GetWorkspaceArgs;

export const createWorkspaceProjects = async (args: CreateWorkspaceProjectsArgs): Promise<void> => {
    const projects = await getProjects(args.terraform_cloud_org_name, args.terraform_cloud_token);
    const project_id = getProjectId(projects.data, args.terraform_cloud_project_name);
    const workspaces = await getWorkspaces(args.terraform_cloud_org_name, args.terraform_cloud_token);
    const project_workspaces = filterWorkspacesForProject(workspaces.data, project_id);
    const workspaces_requiring_creation = getWorkspacesRequiringCreation(args.workspaces_to_create, project_workspaces);
    const created_workspaces = await createWorkspaces(args.terraform_cloud_org_name, args.terraform_cloud_token, project_id, workspaces_requiring_creation);
    await addWorkspacesTags(args.terraform_cloud_token, created_workspaces, args.terraform_cloud_project_name);
};

function getWorkspacesRequiringCreation(all_workspaces: string[], existing_workspaces: WorkspaceInfo[]) {
    const results: string [] = [];

    for (const workspace of all_workspaces) {
        if(existing_workspaces.some((obj) => obj.name === workspace) == false) {
            results.push(workspace);
        }
    }

    return results;
}

function getWorkspacesForCreation(args: string[], starting_idx: number): string[] {
    const results: string[] = [];

    for (let i = starting_idx; i < args.length; i++) {
        results.push(args[i]);
    }

    return results;
}


async function getProjects(org: string, token: string): Promise<any> {
    const response = await fetch(
      `https://app.terraform.io/api/v2/organizations/${org}/projects`, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    const data = await response.json();
    return data;
}

function getProjectId(projects: any[], project_name: string): string {
    const values = projects.filter(i => i.attributes.name === project_name);
    
    if( values.length >= 1) {
      return values[0].id;
    } else {
      return "";
    }
}

async function getWorkspaces(org: string, token: string): Promise<any> {
    const response = await fetch(
        `https://app.terraform.io/api/v2/organizations/${org}/workspaces`, 
        {
            headers: { Authorization: `Bearer ${token}` }
        }
      );
    const data = await response.json();
    return data; 
}

export async function getWorkspace(args: GetWorkspaceArgs): Promise<any> {
    const response = await fetch(
        `https://app.terraform.io/api/v2/organizations/${args.terraform_cloud_org_name}/workspaces/${args.workspace_name}`, 
        {
            headers: { Authorization: `Bearer ${args.terraform_cloud_token}` }
        }
      );
    const data = await response.json();
    return data; 
}

export async function getWorkspaceVariables(args: GetWorkspaceVariablesArgs): Promise<any> {
    const response = await fetch(
        `https://app.terraform.io/api/v2/vars?filter%5Borganization%5D%5Bname%5D=${args.terraform_cloud_org_name}&filter%5Bworkspace%5D%5Bname%5D=${args.workspace_name}`, 
        {
            headers: { Authorization: `Bearer ${args.terraform_cloud_token}` }
        }
      );
    const data = await response.json();
    return data; 
}

export async function createWorkspaceVariable(token: string, workspace_id: string, key: any, value: any): Promise<any> {
    const response = await fetch(
        `https://app.terraform.io/api/v2/vars`, 
        { 
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/vnd.api+json",
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        key: key,
                        value: value,
                        description: null,
                        category: "env",
                        hcl: false,
                        sensitive: false
                    },
                    type: "vars",
                    relationships: {
                        workspace: {
                            data: {
                                id: workspace_id,
                                type: "workspaces"
                            }
                        }
                    }
                }
            }),
        }
    );

    const data: any = await response.json();

    return data; 
}

export async function updateWorkspaceVariable(token: string, variable: any, updated_value: any): Promise<any> {
    const attr = variable.attributes;
    const response = await fetch(
        `https://app.terraform.io/api/v2/vars/${variable.id}`, 
        { 
            method: 'PATCH',
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/vnd.api+json",
            },
            body: JSON.stringify({
            data: {
                id: variable.id,
                attributes: {
                    key: attr.key,
                    value: updated_value,
                    description: attr.description,
                    category: attr.category,
                    hcl: attr.hcl,
                    sensitive: attr.sensitive
                },
                type: variable.type
            }
            }),
        }
    );
    const data: any = await response.json();

    return data; 
}

async function createWorkspaces(org: string, token: string, project_id: string, workspace_names: string[]): Promise<WorkspaceInfo[]> {
    const workspaces: WorkspaceInfo[] = [];

    for (const workspace_name of workspace_names) {
        const workspace = await createWorkspace(org, token, project_id, workspace_name);
        if (workspace != null) {
            workspaces.push(workspace);
        }
    }

    return workspaces;
}

async function createWorkspace(org: string, token: string, project_id: string, workspace_name: string): Promise<WorkspaceInfo | null> {
    const response = await fetch(
        `https://app.terraform.io/api/v2/organizations/${org}/workspaces`, 
        { 
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/vnd.api+json",
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                      name: workspace_name,
                    },
                    relationships: {
                        project: {
                          data: {
                            type: "projects",
                            id: project_id
                          }
                        }
                    },
                    type: "workspaces"
                }
            }),
        }
      );
    const data: any = await response.json();
    let workspace_info: WorkspaceInfo | null = null;
    if (("data" in data)) {
        workspace_info = getWorkspaceInfo(data.data);
    }
     
    return workspace_info; 
}

export const setWorkspaceEnvironmentVariables = async (org: string, workspace_name: string, token: string, variable_values: Map<string, any>): Promise<void> => {
    const getWorkspaceArgs: GetWorkspaceArgs = {
      terraform_cloud_org_name: org,
      terraform_cloud_token: token,
      workspace_name: workspace_name,
    };
    
    const getWorkspaceVariablesArgs: GetWorkspaceVariablesArgs = {
      terraform_cloud_org_name: org,
      terraform_cloud_token: token,
      workspace_name: workspace_name,
    }

    const workspace = await getWorkspace(getWorkspaceArgs);
    const workspace_id = workspace?.data?.id;
    const variables = await getWorkspaceVariables(getWorkspaceVariablesArgs);
    const variables_to_create = getVariablesToCreate(variable_values, variables.data);
    const variables_to_update = getVariablesToUpdate(variable_values, variables.data)
    for (const variable of variables_to_update) {
      const updated_value = variable_values.get(variable?.attributes?.key);
      if (updated_value) {
        updateWorkspaceVariable(token, variable, updated_value);
      }
    }

    for (const variable of variables_to_create) {
      const value = variable_values.get(variable);
      if (value) {
        await createWorkspaceVariable(token, workspace_id, variable, value);
      }
    }
}

async function addWorkspacesTags(token: string, workspaces: WorkspaceInfo[], tag_name: string): Promise<void> {
    for (const workspace of workspaces) {
        if (workspace != null) {
            addWorkspaceTag(token, workspace, tag_name);
        }
    }
}

async function addWorkspaceTag(token: string, workspace: WorkspaceInfo, tag_name: string): Promise<void> {
    const response = await fetch(
        `https://app.terraform.io/api/v2/workspaces/${workspace.id}/relationships/tags`, 
        { 
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/vnd.api+json",
            },
            body: JSON.stringify({
                data: [
                    {
                        attributes: {
                            name: tag_name,
                        },
                        type: "tags"
                    }
                ]
            }),
        }
    );
}

function filterWorkspacesForProject(workspaces: any, project_id: string): WorkspaceInfo[] {
    const results: WorkspaceInfo[] = [];

    for(const workspace of workspaces) {
        const workspace_project_id = workspace?.relationships?.project?.data?.id;
        if(workspace_project_id && workspace_project_id === project_id) {
            results.push(getWorkspaceInfo(workspace));
        }
    }

    return results;
}

function getWorkspaceInfo(workspace: any): WorkspaceInfo {
    return {
        id: workspace.id,
        name: workspace?.attributes?.name,
    }
}

const getVariablesToCreate = (map: Map<string, string>, data: any[]): string[] => {
  const variables: string[] = [];

  const existingKeys = data.map(d => d?.attributes?.key); 

  for (const [key, value] of map) {
    if(!existingKeys.includes(key)) {
      variables.push(key);
    }
  }

  return variables;
}

const getVariablesToUpdate = (map: Map<string, string>, data: any[]): any[] => {
  const objs = data.filter((d) => map.has(d?.attributes?.key)); 

  return objs;
}

type WorkspaceInfo = {
    id: number;
    name: string;
}

type OrganizationInfo = {
    id: number;
    name: string;
}