import { Octokit } from "octokit";
import { environment_value_type, github_repo_info, public_key_info, repo_variable_info } from "./github_types";
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

  public setEnvironmentSecretByRepositoryName = async (organization: string, repository: string, environment: string, secret_name: string, secret_value: string): Promise<void> => {
    const pki = await this.getEnvironmentPublicKey(organization, repository, environment);
    const encrypted_value = await encrypt(secret_value, pki.key);
    //https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#create-or-update-an-environment-secret
    const response = await this._octokit.request(`PUT /repos/${organization}/${repository}/environments/${environment}/secrets/${secret_name}`, {
      encrypted_value: encrypted_value,
      key_id: pki.key_id,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });
  }

  public setEnvironmentSecret = async (inputs: environment_value_type): Promise<void> => {    
      for (const repository of inputs.repositories) {
        await this.createEnvironment(
          inputs.organization,
          repository.name,
          inputs.environment_name,
        );
        const respository_public_key_info = await this.getEnvironmentPublicKeys(inputs.organization, [repository], inputs.environment_name);
        const public_key = respository_public_key_info.get(repository.name);
                  
        if (public_key?.key) {
          const encrypted_value = await encrypt(inputs.value, public_key.key);
          await this.createEnvironmentSecret(repository, inputs.environment_name, inputs.key, encrypted_value, public_key.key_id);
        }
      }
    };

  public setEnvironmentVariable = async (inputs: environment_value_type): Promise<void> => {    
      for (const repository of inputs.repositories) {
        await this.createEnvironment(
          inputs.organization,
          repository.name,
          inputs.environment_name,
        );
        
        this.createRepositoryEnvironmentVariable(
          inputs.organization,
          repository.name, 
          inputs.environment_name,
          inputs.key,
          inputs.value
        );
      }
    };
        
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
    const results = await this._octokit.request('GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key', {
          owner: organization_name,
          repo: repository_name,
          environment_name: environment_name,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
      });
  
    return results.data;
  }
  
  public async createRepositoryEnvironmentVariable(organization: string, repo: string, environment_name: string, variable_name: string, variable_value: string) {
      if(await this.hasEnvironmentVariables(organization, variable_name, repo, environment_name)) {
        this.updateEnvironmentVariable(organization, repo, environment_name,variable_name, variable_value);
      } else {
        this.createEnvironmentVariable(organization, repo, environment_name,variable_name, variable_value);
      }
  }
  
  public async createEnvironmentVariable(organization: string, repository: string, environment_name: string, variable_name: string, variable_value: string) {
    await this._octokit.request(`POST /repos/${organization}/${repository}/environments/${environment_name}/variables`, {
      name: variable_name,
      value: variable_value,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });
  }
  
  public async updateEnvironmentVariable(organization: string, repository: string, environment_name: string, variable_name: string, variable_value: string) {
    await this._octokit.request(`PATCH /repos/${organization}/${repository}/environments/${environment_name}/variables/${variable_name}`, {
      name: variable_name,
      value: variable_value,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
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
  
  public async hasEnvironmentVariables(organization: string, variable_name: string, repository: string, environment_name: string): Promise<boolean> {
    try {
      const variables = await this.getEnvironmentVariables(organization, repository, environment_name);
      const upper_cased_var_name = variable_name.toUpperCase()
      const results = variables.filter((obj) => obj.name.toUpperCase() === upper_cased_var_name);
  
      return results.length == 1;
    } catch (error) {
      console.log(`
        hasEnvironmentVariables
      errormessage = ${error}
    `);
      return false;
    }
  }
  
  public async getEnvironmentVariables(organization: string, repository: string, environment_name: string):Promise<repo_variable_info[]> {
    const results = await this._octokit.request(`GET /repos/${organization}/${repository}/environments/${environment_name}/variables?per_page=30&page=1`, {
        headers: {
          'X-GitHub-Api-Version': '2026-03-10'
        }
    });
    
    return results.data.variables;
  }
}