import { encrypt } from "../../src/encrypt";
import { RepositoryPropertyValues } from "../../src/github/github_classes";
import { GitHubHelper } from "../../src/github/github_helper";
import { github_repo_info } from "../../src/github/github_types";

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
    const token = ''; //process.env.GH_ACCESS_TOKEN;
    console.log(`process.env.GH_ACCESS_TOKEN=${token}`);
    if (token) {
        const organization = 'ebpublishing';
        const repository_name = 'ebpublishing-admanager-aws-iam';
        const environment_name = 'MikeTest123';
        const secret_key = 'MYSECRETKEY123';
        const secret = 'MYSECRETVALUE';
        const helper = new GitHubHelper(token);
        const repositories = await helper.Organization.getRepositories(organization);
        const repo_property_values = await helper.Repository.getCustomProperties(organization);
        const results = getOrganizationReposToUpdate(repositories, repo_property_values);
        console.log(JSON.stringify(results));
        helper.Repository.setEnvironmentSecret({
            organization,
            repositories: results,
            environment_name,
            secret_key: secret_key,
            secret_value: secret,
        });
        //const results = repositories.filter (x => x.name === repository_name)
            // for (const repository of results) {
            //     await helper.Repository.createEnvironment(
            //         organization,
            //         repository.name,
            //         environment_name,
            //     );

            //     console.log(`repository id = ${repository.id}`);
            //     const respository_public_key_info = await helper.Repository.getEnvironmentPublicKeys(organization, results, environment_name);
            //     const key = respository_public_key_info.get(repository_name);
            //     console.log(`public key = ${key?.key}`);
                
            //     if (key?.key) {
            //         const encrypted_value = await encrypt(secret, key.key);
            //         console.log(`encrypted value = ${encrypted_value}`);
            //         await helper.Repository.createEnvironmentSecret(repository, environment_name, 'TESTSECRET1', encrypted_value, key.key_id);
            //     }

            //     await helper.Repository.createEnvironmentVariables([repository], environment_name, 'Test123', 'abcdefghjkl');
            // }
        } else {
            console.log('no results!!!!');
        }

    console.log('hello');
    // const manager = new SecretsManager();
    // const hasSecret = await manager.upsertSecret("MikeTest1", "value1234567890");
    // console.log(hasSecret);
})();