import { Octokit, App } from "octokit";
import { encrypt } from "./encrypt";
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
  
  async function createRepositoryEnvironments(octokit: Octokit, organization_name: string, repos: github_repo_info[], environment_name: string) {
      for(const repo of repos) {
          createRepositoryEnvironment(octokit, organization_name, repo.name, environment_name);
      }
  }
  
  async function createRepositoryEnvironment(octokit: Octokit, organization_name: string, repository_name: string, environment_name: string) {
      const response = await octokit.request(`PUT /repos/${organization_name}/${repository_name}/environments/${environment_name}`, {
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
      });
  }
  
  async function getOrganizatonPublicKey(octokit: Octokit, organization_name: string): Promise<public_key_info> {
      const results = await octokit.request(`GET /orgs/${organization_name}/actions/secrets/public-key`, {
          org: 'ORG',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
  
      return results.data;
  }
  
  async function getRepositoryEnvironmentPublicKeys(octokit: Octokit, organization_name: string, repositories: github_repo_info[], environment_name: string): Promise<RepositoryPublicKeyInfoCollection> {
    const collection = new RepositoryPublicKeyInfoCollection();
  
    for (const repository of repositories) {
      const pki = await getRepositoryEnvironmentPublicKey(octokit, organization_name, repository.name, environment_name);
      collection.add(repository.name, pki);
    }
  
    return collection;
  }
  
  async function getRepositoryEnvironmentPublicKey(octokit: Octokit, organization_name: string, repository_name: string, environment_name: string): Promise<public_key_info> {
    // https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#get-an-environment-public-key
    const results = await octokit.request(`GET /repos/${organization_name}/${repository_name}/environments/${environment_name}/secrets/public-key`, {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
  
      //console.log(results);
  
    return results.data;
  }
  
  async function createRepositoryEnvironmentVariables(octokit: Octokit, repos: github_repo_info[], environment_name: string, variable_name: string, variable_value: string) {
    
    for(const repo of repos) {
      if(await hasRepositoryEnvironmentVariables(octokit, variable_name, repo.id, environment_name)) {
        updateRepositoryEnvironmentVariable(octokit, repo.id, environment_name,variable_name, variable_value);
      } else {
        createRepositoryEnvironmentVariable(octokit, repo.id, environment_name,variable_name, variable_value);
      }
    }
  }
  
  async function createRepositoryEnvironmentVariable(octokit: Octokit, repository_id: number, environment_name: string, variable_name: string, variable_value: string) {
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
  
  async function updateRepositoryEnvironmentVariable(octokit: Octokit, repository_id: number, environment_name: string, variable_name: string, variable_value: string) {
      await octokit.request(`PATCH /repositories/${repository_id}/environments/${environment_name}/variables/${variable_name}`, {
          name: variable_name,
          value: variable_value,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
        
  }
  
  async function createRepositoryEnvironmentSecrets(octokit: Octokit, repos: github_repo_info[], repository_public_key_info: RepositoryPublicKeyInfoCollection, organization_name: string, environment_name: string, secret_name: string, secret_value: string) {
      for(const repo of repos) {
          const key_info = repository_public_key_info.get(repo.name);
          if(key_info) {
            const encrypted_secret_value = await encrypt(secret_value, key_info.key);
            await createRepositoryEnvironmentSecret(octokit, repo, organization_name, environment_name, secret_name, encrypted_secret_value, key_info.key_id);
          }
      }
  }
  
  async function createRepositoryEnvironmentSecret(octokit: Octokit, repo: github_repo_info, organization_name: string, environment_name: string, secret_name: string, secret_value: string, encryption_key_id: string) {
    //https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#create-or-update-an-environment-secret
    const response = await octokit.request(`PUT /repositories/${repo.id}/environments/${environment_name}/secrets/${secret_name}`, {
      encrypted_value: secret_value,
      key_id: encryption_key_id,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    // console.log(repo.name.repeat(5));
    //// console.log(JSON.stringify(response));
    // console.log(`encrypted_value: ${secret_value}`);
    // console.log(`key_id: ${encryption_key_id}`);
    // console.log(repo.name.repeat(5));
  }
  
  async function hasRepositoryEnvironmentVariables(octokit: Octokit, variable_name: string, repository_id: number, environment_name: string): Promise<boolean> {
    try {
      const variables = await getRepositoryEnvironmentVariables(octokit, repository_id, environment_name);
      const results = variables.filter((obj) => obj.name === variable_name);
  
      return results.length == 1;
    } catch (error) {
      return false;
    }
  }
  
   async function getRepositoryEnvironmentVariables(octokit: Octokit, repository_id: number, environment_name: string):Promise<repo_variable_info[]> {
      const results = await octokit.request(`GET /repositories/${repository_id}/environments/${environment_name}/variables?per_page=30`, {
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
  
      
      return results.data.variables;
   }
  
  type github_repo_info = {
      id: number;
      name: string;
  };
  
  type repo_variable_info = {
      name: string;
      value: string;
  }
  
  type public_key_info = {
      key_id: string,
      key: string
  }
  
  class RepositoryPublicKeyInfoCollection {
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