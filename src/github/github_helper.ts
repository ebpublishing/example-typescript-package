import { Octokit } from "octokit";
import { Organization } from './organization';
import { Repository } from './repository';

export class GitHubHelper {
  readonly Organization: Organization;
  readonly Repository: Repository;

  constructor(github_access_token: string) {
    const octokit = new Octokit({ auth: github_access_token });
    this.Organization = new Organization(octokit);
    this.Repository = new Repository(octokit);
  }  
}