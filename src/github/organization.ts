import { Octokit } from "octokit";
import { environment_variable, github_repo_info, public_key_info, repo_variable_info, self_hosted_runner } from "./github_types";
import { SelfHostedRunner } from "./self_hosted_runner";
import { getOrganizatonPublicKey } from "../github";
import { encrypt } from "../encrypt";

export class Organization {
  private _octokit: Octokit;
  private _self_hosted_runner: SelfHostedRunner;

  constructor(
    octokit: Octokit,
    self_hosted_runner: SelfHostedRunner) {
    this._octokit = octokit;
    this._self_hosted_runner = self_hosted_runner;
  }

  public async setEnvironmentVariables(organization_name: string, vars: repo_variable_info[]): Promise<void> {
    const variables_to_create: repo_variable_info[] = [];
    const variables_to_update: repo_variable_info[] = [];
  
    const environment_variables = await this.getEnviromentVariables(organization_name);
  
    for (const var_info of vars) {
      if (environment_variables.filter((env_var) => { env_var.name === var_info.name}).length > 0) {
        variables_to_update.push(var_info);
      } else {
        variables_to_create.push(var_info);
      }
    }
  
    await this.createEnvironmentVariables(organization_name, variables_to_create);
    await this.updateEnvironmentVariables(organization_name, variables_to_update);
  }
      
  public async getEnviromentVariables(organization_name: string): Promise<environment_variable[]> {
    const results = await this._octokit.request(`GET /orgs/${organization_name}/actions/variables`, {
      org: 'ORG',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  
    return results.data.variables;
  }
      
  public async createEnvironmentVariables(organization_name: string, vars: repo_variable_info[]): Promise<void> {
    for (const var_info of vars) {
      this.createEnvironmentVariable(organization_name, var_info);
    }
  }
      
  public async createEnvironmentVariable(organization_name: string, var_info: repo_variable_info): Promise<void> {
    await this._octokit.request(`POST /orgs/${organization_name}/actions/variables`, {
      org: 'ORG',
      name: var_info.name,
      value: var_info.value,
      visibility: 'private',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }

  async setOrganizationSecret(organization_name: string, variable_name: string, variable_value: string): Promise<void> {
    const public_key_info = await this.getPublicKey(organization_name);
    const encrypted_value = await encrypt(variable_value, public_key_info.key);
    this.createOrUpdateOrganizationSecret(organization_name, variable_name, encrypted_value, public_key_info.key_id);
  }

  async createOrUpdateOrganizationSecret(organization_name: string, variable_name: string, encrypted_variable_value: string, key_id: string): Promise<void> {
    await this._octokit.request(`POST /orgs/${organization_name}/actions/secrets/${variable_name}`, {
      encrypted_value: encrypted_variable_value,
      key_id: key_id,
      visibility: 'private',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
      
  public async updateEnvironmentVariables(organization_name: string, vars: repo_variable_info[]): Promise<void> {
    for (const var_info of vars) {
      this.updateEnvironmentVariable(organization_name, var_info);
    }
  }
      
  public async updateEnvironmentVariable(organization_name: string, var_info: repo_variable_info): Promise<void> {
    await this._octokit.request(`PATCH /orgs/${organization_name}/actions/variables/${var_info.name}`, {
      org: 'ORG',
      name: var_info.name,
      value: var_info.value,
      visibility: 'private',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
        
  public async getRepositories(organization_name: string): Promise<github_repo_info[]> {
    const repos: github_repo_info[] = [];
    const results = await this._octokit.request(`GET /orgs/${organization_name}/repos?per_page=100`, {
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
        
  public async getPublicKey(organization_name: string): Promise<public_key_info> {
    const results = await this._octokit.request(`GET /orgs/${organization_name}/actions/secrets/public-key`, {
      org: 'ORG',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    return results.data;
  }

  public async getSelfHostedRunners(organization_name: string): Promise<self_hosted_runner[]> {
    // https://docs.github.com/en/rest/actions/self-hosted-runners?apiVersion=2022-11-28#list-self-hosted-runners-for-an-organization
    const results = await this._octokit.request(`GET /orgs/${organization_name}/actions/runners`, {
      org: 'ORG',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    return results.data.runners;
  }

  public async setLabelsForSelfHostedRunners(organization_name: string, self_hosted_runner_names: string[], labels: string[]) {
    const self_hosted_runners = await this.getSelfHostedRunners(organization_name);
    const runner_ids_to_update = self_hosted_runners
                                  .filter((runner) => self_hosted_runner_names.includes(runner.name))
                                  .map((runner) => runner.id);
    this._self_hosted_runner.setCustomLabelsForRunners(organization_name, runner_ids_to_update, labels);
  }
}