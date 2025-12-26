import { Octokit } from "octokit";
import { Organization } from './organization';
import { Repository } from './repository';
import { SelfHostedRunner } from "./self_hosted_runner";
import { github_repo_info } from "./github_types";
import { RepositoryPropertyValues } from "./github_classes";

export class GitHubHelper {
  readonly Organization: Organization;
  readonly Repository: Repository;
  readonly SelfHostedRunner: SelfHostedRunner;

  constructor(github_access_token: string) {
    const octokit = new Octokit({ auth: github_access_token });
    const self_hosted_runner = new SelfHostedRunner(octokit);
    const organization = new Organization(octokit, self_hosted_runner);
    this.Organization = organization;
    this.Repository = new Repository(octokit, organization);
    this.SelfHostedRunner = self_hosted_runner;
  }
  
  updateCustomVariableBySelectionCriteria = async (
    {
      github_organization_name,
      github_environment_name,
      property_name,
      variable_name,
      variable_value,
      condition_checker,
    }: {
      github_organization_name: string,
      github_environment_name: string,
      property_name: string,
      variable_name: string,
      variable_value: string,
      condition_checker: (property: string | undefined) => boolean,
    }
  ): Promise<void> => {
      const repos = await this.Organization.getRepositories(github_organization_name);
      const repo_property_values = await this.Repository.getCustomProperties(github_organization_name);
      const repos_to_update: github_repo_info[] = this.getOrganizationReposToUpdate(repos, property_name, condition_checker, repo_property_values);
      console.log(">><<".repeat(30));
      console.log(JSON.stringify(repos_to_update));
      console.log(">><<".repeat(30));
      await this.Repository.createEnvironments(github_organization_name, repos_to_update, github_environment_name);
      await this.Repository.createEnvironmentVariables(repos_to_update, github_environment_name, variable_name, variable_value);
  }

  private getOrganizationReposToUpdate = (
    repos: github_repo_info[], 
    property_name: string, 
    condition_checker: (property: string | undefined) => boolean,
    repo_property_values: RepositoryPropertyValues): github_repo_info[] => {
    const repos_to_update: github_repo_info[] = [];

    for(const repo of repos) {
      const property_value = repo_property_values.getPropertyValueForRepository(repo.id, property_name);
      console.log(`REPOSITORYID=${repo.id}, REPOSITORYNAME=${repo.name}, PROPERTYVALUE=${property_value}, typeof = ${typeof property_value}`);
      if (condition_checker(property_value )) {
        repos_to_update.push(repo);
      }
    }

    return repos_to_update;
  }
}