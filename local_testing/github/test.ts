import { encrypt } from "../../src/encrypt";
import { RepositoryPropertyValues } from "../../src/github/github_classes";
import { GitHubHelper } from "../../src/github/github_helper";
import { github_repo_info } from "../../src/github/github_types";
import { selectValueEqualsYes } from "../../src/github/github_custom_properties_selector";

const getOrganizationReposToUpdate = (repos: github_repo_info[], repo_property_values: RepositoryPropertyValues): github_repo_info[] => {
  const repos_to_update: github_repo_info[] = [];

  for(const repo of repos) {
    const property_value = repo_property_values.getPropertyValueForRepository(repo.id, 'REQUIRES_ACCESS_KEY_UPDATE');
    if (typeof property_value === "string" && property_value === "YES") {
      repos_to_update.push(repo);
    }
  }

  return repos_to_update;
}


(async () => {
    const token = process.env.GH_ACCESS_TOKEN;
    console.log(`process.env.GH_ACCESS_TOKEN=${token}`);
    const organization = 'ebpublishing';
    const environment_name = 'NewTest123';

    if (!token) {
        return;
    }
    const helper = new GitHubHelper(token);
    await helper.setEnvironmentVariableBasedOnCustomPropertyValue(
        {
            organization,
            property_name: 'REQUIRES_ACCESS_KEY_UPDATE',
            selector: (property_value: string | undefined): boolean => { return typeof property_value === "string" && property_value === "YES"; },
            environment_name,
            key: 'MyTestKey',
            value: 'MyTestValue',
        }
    );

    await helper.setEnvironmentSecretBasedOnCustomPropertyValue(
        {
            organization,
            property_name: 'REQUIRES_ACCESS_KEY_UPDATE',
            selector: selectValueEqualsYes,
            environment_name,
            key: 'MyTestSecretKey12',
            value: 'MyTestValue12',
        }
    );

    console.log('hello');
    // const manager = new SecretsManager();
    // const hasSecret = await manager.upsertSecret("MikeTest1", "value1234567890");
    // console.log(hasSecret);
})();
