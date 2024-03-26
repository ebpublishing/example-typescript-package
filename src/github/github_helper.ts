import { Octokit } from "octokit";
import { Organization } from './organization';
import { Repository } from './repository';
import { SelfHostedRunner } from "./self_hosted_runner";

export class GitHubHelper {
  readonly Organization: Organization;
  readonly Repository: Repository;
  readonly SelfHostedRunner: SelfHostedRunner;

  constructor(github_access_token: string) {
    const octokit = new Octokit({ auth: github_access_token });
    const self_hosted_runner = new SelfHostedRunner(octokit);
    this.Organization = new Organization(octokit, self_hosted_runner);
    this.Repository = new Repository(octokit);
    this.SelfHostedRunner = self_hosted_runner;
  }  
}