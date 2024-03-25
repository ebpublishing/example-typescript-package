import { Octokit } from "octokit";
import { github_repo_info, public_key_info, repo_variable_info } from "./github_types";
import { encrypt } from "../encrypt";
import { RepositoryPropertyValues, RepositoryPublicKeyInfoCollection } from "./github_classes";

export class SelfHostedRunner {
  private _octokit: Octokit;

  constructor(octokit: Octokit) {
      this._octokit = octokit;
  }

  public async setCustomLabels(organization_name: string, runner_id: string, labels: string[]): Promise<void> {
    const results = await this._octokit.request(`PUT /orgs/${organization_name}/actions/runners/${runner_id}/labels`, {
      org: 'ORG',
      runner_id: 'RUNNER_ID',
      labels: labels,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
}