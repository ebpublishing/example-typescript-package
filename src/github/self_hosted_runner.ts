import { Octokit } from "octokit";

export class SelfHostedRunner {
  private _octokit: Octokit;

  constructor(octokit: Octokit) {
      this._octokit = octokit;
  }

  public async setCustomLabelsForRunners(organization_name: string, runner_ids: number[], labels: string[]): Promise<void> {
    for (const runner_id of runner_ids) {
      this.setCustomLabels(organization_name, runner_id, labels);
    }
  }

  public async setCustomLabels(organization_name: string, runner_id: number, labels: string[]): Promise<void> {
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