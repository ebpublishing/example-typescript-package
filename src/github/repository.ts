import { Octokit } from "octokit";
import { github_repo_info, public_key_info, repo_variable_info } from "./github_types";
import { encrypt } from "../encrypt";
import { RepositoryPropertyValues, RepositoryPublicKeyInfoCollection } from "./github_classes";
import { Organization } from "./organization";

export class Repository {
  private _octokit: Octokit;
  private _organization: Organization;

  constructor(octokit: Octokit, organization: Organization) {
    this._octokit = octokit;
    this._organization = organization;
  }  
        
  public async getCustomProperties(organization_name: string): Promise<RepositoryPropertyValues> {
    const properties = new RepositoryPropertyValues();
  
    // https://docs.github.com/en/rest/orgs/custom-properties?apiVersion=2022-11-28#list-custom-property-values-for-organization-repositories
    const results = await this._octokit.request(`GET /orgs/${organization_name}/properties/values?per_page=100`, {
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
        
  public async createEnvironments(organization_name: string, repos: github_repo_info[], environment_name: string) {
    for(const repo of repos) {
        this.createEnvironment(organization_name, repo.name, environment_name);
    }
  }
        
  public async createEnvironment(organization_name: string, repository_name: string, environment_name: string) {
    // https://docs.github.com/en/rest/deployments/environments?apiVersion=2022-11-28#create-or-update-an-environment
    const response = await this._octokit.request(`PUT /repos/${organization_name}/${repository_name}/environments/${environment_name}`, {
      wait_timer: 0,
      prevent_self_review: false,
      reviewers: null,
      deployment_branch_policy: null,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    console.log(`createEnvironment: ${repository_name},   `.repeat(4));
    console.log(JSON.stringify(response));
    console.log(`createEnvironment: ${repository_name},   `.repeat(4));
  }
        
  public async getEnvironmentPublicKeys(organization_name: string, repositories: github_repo_info[], environment_name: string): Promise<RepositoryPublicKeyInfoCollection> {
    const collection = new RepositoryPublicKeyInfoCollection();
  
    for (const repository of repositories) {
      const pki = await this.getEnvironmentPublicKey(organization_name, repository.name, environment_name);
      collection.add(repository.name, pki);
    }
  
    return collection;
  }
  
  public async getEnvironmentPublicKey(organization_name: string, repository_name: string, environment_name: string): Promise<public_key_info> {
    // https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#get-an-environment-public-key
    const results = await this._octokit.request(`GET /repos/${organization_name}/${repository_name}/environments/${environment_name}/secrets/public-key`, {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
  
      //console.log(results);
  
    return results.data;
  }

  public async setEnvironmentVariableByOrganizationAndRepoName(organization_name: string, repo_name: string, environment_name: string, variable_name: string, variable_value: string) {
    const repo = await this._organization.getOrganizationRepository(organization_name, repo_name);
    const repos = [repo];
    this.createEnvironmentVariables(repos, environment_name, variable_name, variable_value);
  }
  
  public async createEnvironmentVariables(repos: github_repo_info[], environment_name: string, variable_name: string, variable_value: string) {
    for(const repo of repos) {
      if(await this.hasEnvironmentVariables(variable_name, repo.id, environment_name)) {
        this.updateEnvironmentVariable(repo.id, environment_name,variable_name, variable_value);
      } else {
        this.createEnvironmentVariable(repo.id, environment_name,variable_name, variable_value);
      }
    }
  }
  
  public async createEnvironmentVariable(repository_id: number, environment_name: string, variable_name: string, variable_value: string) {
    await this._octokit.request(`POST /repositories/${repository_id}/environments/${environment_name}/variables`, {
      repository_id: 'REPOSITORY_ID',
      environment_name: 'ENVIRONMENT_NAME',
      name: variable_name,
      value: variable_value,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
  
  public async updateEnvironmentVariable(repository_id: number, environment_name: string, variable_name: string, variable_value: string) {
    await this._octokit.request(`PATCH /repositories/${repository_id}/environments/${environment_name}/variables/${variable_name}`, {
      name: variable_name,
      value: variable_value,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });     
  }
  
  public async createEnvironmentSecrets(repos: github_repo_info[], repository_public_key_info: RepositoryPublicKeyInfoCollection, organization_name: string, environment_name: string, secret_name: string, secret_value: string) {
    for(const repo of repos) {
      const key_info = repository_public_key_info.get(repo.name);
      if(key_info) {
        const encrypted_secret_value = await encrypt(secret_value, key_info.key);
        await this.createEnvironmentSecret(repo, environment_name, secret_name, encrypted_secret_value, key_info.key_id);
      }
    }
  }
  
  public async createEnvironmentSecret(repo: github_repo_info, environment_name: string, secret_name: string, secret_value: string, encryption_key_id: string) {
    //https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#create-or-update-an-environment-secret
    const response = await this._octokit.request(`PUT /repositories/${repo.id}/environments/${environment_name}/secrets/${secret_name}`, {
      encrypted_value: secret_value,
      key_id: encryption_key_id,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
  
  public async hasEnvironmentVariables(variable_name: string, repository_id: number, environment_name: string): Promise<boolean> {
    try {
      const variables = await this.getEnvironmentVariables(repository_id, environment_name);
      const results = variables.filter((obj) => obj.name === variable_name);
  
      return results.length == 1;
    } catch (error) {
      return false;
    }
  }
  
  public async getEnvironmentVariables(repository_id: number, environment_name: string):Promise<repo_variable_info[]> {
    const results = await this._octokit.request(`GET /repositories/${repository_id}/environments/${environment_name}/variables?per_page=30`, {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    console.log(`
      getEnvironmentVariables = ${JSON.stringify(results)}
    `);
    
    return results.data.variables;
  }
}