import { Octokit, App } from "octokit";
import { encrypt } from "./encrypt";

export async function setOrganizationEnvironmentVariables(octokit: Octokit, organization_name: string, vars: repo_variable_info[]): Promise<void> {
  const variables_to_create: repo_variable_info[] = [];
  const variables_to_update: repo_variable_info[] = [];

  const environment_variables = await getOrganizationEnviromentVariables(octokit, organization_name);

  for (const var_info of vars) {
    if (environment_variables.filter((env_var) => { env_var.name === var_info.name}).length > 0) {
      variables_to_update.push(var_info);
    } else {
      variables_to_create.push(var_info);
    }
  }

  await createOrganizationEnvironmentVariables(octokit, organization_name, variables_to_create);
  await updateOrganizationEnvironmentVariables(octokit, organization_name, variables_to_update);

}

export async function getOrganizationEnviromentVariables(octokit: Octokit, organization_name: string): Promise<environment_variable[]> {
  const results = await octokit.request(`GET /orgs/${organization_name}/actions/variables`, {
    org: 'ORG',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  return results.data;
}

export async function createOrganizationEnvironmentVariables(octokit: Octokit, organization_name: string, vars: repo_variable_info[]): Promise<void> {
  for (const var_info of vars) {
    createOrganizationEnvironmentVariable(octokit, organization_name, var_info);
  }
}

export async function createOrganizationEnvironmentVariable(octokit: Octokit, organization_name: string, var_info: repo_variable_info): Promise<void> {
  await octokit.request(`POST /orgs/${organization_name}/actions/variables`, {
    org: 'ORG',
    name: var_info.name,
    value: var_info.value,
    visibility: 'private',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

export async function updateOrganizationEnvironmentVariables(octokit: Octokit, organization_name: string, vars: repo_variable_info[]): Promise<void> {
  for (const var_info of vars) {
    updateOrganizationEnvironmentVariable(octokit, organization_name, var_info);
  }
}

export async function updateOrganizationEnvironmentVariable(octokit: Octokit, organization_name: string, var_info: repo_variable_info): Promise<void> {
  await octokit.request(`PATCH /orgs/${organization_name}/actions/variables/${var_info.name}`, {
    org: 'ORG',
    name: var_info.name,
    value: var_info.value,
    visibility: 'private',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

export function getOrganizationReposToUpdate(repos: github_repo_info[], repo_property_values: RepositoryPropertyValues): github_repo_info[] {
    const repos_to_update: github_repo_info[] = [];
  
    for(const repo of repos) {
      const property_value = repo_property_values.getPropertyValueForRepository(repo.id, 'REQUIRES_ACCESS_KEY_UPDATE');
      if (typeof property_value === "string" && property_value === "YES") {
        repos_to_update.push(repo);
      }
    }
  
    return repos_to_update;
  }
  
export async function getOrganizationRepositories(octokit: Octokit, organization_name: string): Promise<github_repo_info[]> {
      const repos: github_repo_info[] = [];
      const results = await octokit.request(`GET /orgs/${organization_name}/repos?per_page=100`, {
          org: 'ORG',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
  
      for(const element of results.data) {
          repos.push(
              {
                  id: element.id,
                  name: element.name
              }
          );
      }
  
      return repos;
  }
  
  export async function getRepositoryCustomProperties(octokit: Octokit, organization_name: string): Promise<RepositoryPropertyValues> {
    const properties = new RepositoryPropertyValues();
  
    // https://docs.github.com/en/rest/orgs/custom-properties?apiVersion=2022-11-28#list-custom-property-values-for-organization-repositories
    const results = await octokit.request(`GET /orgs/${organization_name}/properties/values?per_page=100`, {
      org: 'ORG',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  
    for(const element of results.data) {
      for (const property of element.properties) {
        properties.add(element.repository_id, property.property_name, property.value);
      }
    }
  
    return properties;
  }
  
  export async function createRepositoryEnvironments(octokit: Octokit, organization_name: string, repos: github_repo_info[], environment_name: string) {
      for(const repo of repos) {
          createRepositoryEnvironment(octokit, organization_name, repo.name, environment_name);
      }
  }
  
  export async function createRepositoryEnvironment(octokit: Octokit, organization_name: string, repository_name: string, environment_name: string) {
      const response = await octokit.request(`PUT /repos/${organization_name}/${repository_name}/environments/${environment_name}`, {
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
      });
  }
  
  export async function getOrganizatonPublicKey(octokit: Octokit, organization_name: string): Promise<public_key_info> {
      const results = await octokit.request(`GET /orgs/${organization_name}/actions/secrets/public-key`, {
          org: 'ORG',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
  
      return results.data;
  }
  
  export async function getRepositoryEnvironmentPublicKeys(octokit: Octokit, organization_name: string, repositories: github_repo_info[], environment_name: string): Promise<RepositoryPublicKeyInfoCollection> {
    const collection = new RepositoryPublicKeyInfoCollection();
  
    for (const repository of repositories) {
      const pki = await getRepositoryEnvironmentPublicKey(octokit, organization_name, repository.name, environment_name);
      collection.add(repository.name, pki);
    }
  
    return collection;
  }
  
  export async function getRepositoryEnvironmentPublicKey(octokit: Octokit, organization_name: string, repository_name: string, environment_name: string): Promise<public_key_info> {
    // https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#get-an-environment-public-key
    const results = await octokit.request(`GET /repos/${organization_name}/${repository_name}/environments/${environment_name}/secrets/public-key`, {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
  
      //console.log(results);
  
    return results.data;
  }
  
  export async function createRepositoryEnvironmentVariables(octokit: Octokit, repos: github_repo_info[], environment_name: string, variable_name: string, variable_value: string) {
    
    for(const repo of repos) {
      if(await hasRepositoryEnvironmentVariables(octokit, variable_name, repo.id, environment_name)) {
        updateRepositoryEnvironmentVariable(octokit, repo.id, environment_name,variable_name, variable_value);
      } else {
        createRepositoryEnvironmentVariable(octokit, repo.id, environment_name,variable_name, variable_value);
      }
    }
  }
  
  export async function createRepositoryEnvironmentVariable(octokit: Octokit, repository_id: number, environment_name: string, variable_name: string, variable_value: string) {
      await octokit.request(`POST /repositories/${repository_id}/environments/${environment_name}/variables`, {
          repository_id: 'REPOSITORY_ID',
          environment_name: 'ENVIRONMENT_NAME',
          name: variable_name,
          value: variable_value,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
  }
  
  export async function updateRepositoryEnvironmentVariable(octokit: Octokit, repository_id: number, environment_name: string, variable_name: string, variable_value: string) {
      await octokit.request(`PATCH /repositories/${repository_id}/environments/${environment_name}/variables/${variable_name}`, {
          name: variable_name,
          value: variable_value,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
        
  }
  
  export async function createRepositoryEnvironmentSecrets(octokit: Octokit, repos: github_repo_info[], repository_public_key_info: RepositoryPublicKeyInfoCollection, organization_name: string, environment_name: string, secret_name: string, secret_value: string) {
      for(const repo of repos) {
          const key_info = repository_public_key_info.get(repo.name);
          if(key_info) {
            const encrypted_secret_value = await encrypt(secret_value, key_info.key);
            await createRepositoryEnvironmentSecret(octokit, repo, environment_name, secret_name, encrypted_secret_value, key_info.key_id);
          }
      }
  }
  
  export async function createRepositoryEnvironmentSecret(octokit: Octokit, repo: github_repo_info, environment_name: string, secret_name: string, secret_value: string, encryption_key_id: string) {
    //https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#create-or-update-an-environment-secret
    const response = await octokit.request(`PUT /repositories/${repo.id}/environments/${environment_name}/secrets/${secret_name}`, {
      encrypted_value: secret_value,
      key_id: encryption_key_id,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
  
  export async function hasRepositoryEnvironmentVariables(octokit: Octokit, variable_name: string, repository_id: number, environment_name: string): Promise<boolean> {
    try {
      const variables = await getRepositoryEnvironmentVariables(octokit, repository_id, environment_name);
      const results = variables.filter((obj) => obj.name === variable_name);
  
      return results.length == 1;
    } catch (error) {
      return false;
    }
  }
  
  export async function getRepositoryEnvironmentVariables(octokit: Octokit, repository_id: number, environment_name: string):Promise<repo_variable_info[]> {
      const results = await octokit.request(`GET /repositories/${repository_id}/environments/${environment_name}/variables?per_page=30`, {
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
  
      
      return results.data.variables;
   }
  
  export type github_repo_info = {
      id: number;
      name: string;
  };
  
  export type repo_variable_info = {
      name: string;
      value: string;
  }
  
  export type public_key_info = {
      key_id: string,
      key: string
  }

  export type environment_variable = {
    name: string,
    value: any,
    created_at: string,
    updated_at: string,
    visibility: string,
  }
  
  export class RepositoryPublicKeyInfoCollection {
    private _map: Map<string, public_key_info>;
  
    constructor() {
      this._map = new Map<string, public_key_info>();
    }
  
    public add(repository_name: string, public_key_info: public_key_info): void {
      this._map.set(repository_name, public_key_info);
    }
  
    public get(repository_name: string): public_key_info | undefined {
      return this._map.get(repository_name);
    }
}

export class RepositoryPropertyValues {
    private _propertyValues: Map<number, Map<string, string>>;
  
    constructor() {
      this._propertyValues = new Map<number, Map<string, string>>();
    }
  
    public add(repository_id: number, property_name: string, property_value: string) {
      if(this._propertyValues.has(repository_id)) {
        this._propertyValues.get(repository_id)?.set(property_name, property_value);
      } else {
        const map = new Map<string, string>([[property_name, property_value]]);
        this._propertyValues.set(repository_id, map);
      }
    }
  
    public hasPropertyValueForRepository(repository_id: number, property_name: string): boolean | undefined {
      return this._propertyValues.has(repository_id) && this._propertyValues.get(repository_id)?.has(property_name);
    }
  
    public getPropertyValueForRepository(repository_id: number, property_name: string): string | undefined {
      return this._propertyValues.get(repository_id)?.get(property_name);
    }
}