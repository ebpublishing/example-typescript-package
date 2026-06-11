import { encrypt } from "../../src/encrypt";
import { RepositoryPropertyValues } from "../../src/github/github_classes";
import { GitHubHelper } from "../../src/github/github_helper";
import { github_repo_info } from "../../src/github/github_types";
import { selectValueEqualsYes } from "../../src/github/github_custom_properties_selector";
import { 
  createWorkspaceProjects, 
  CreateWorkspaceProjectsArgs, 
  createWorkspaceVariable, 
  getWorkspace, 
  GetWorkspaceArgs, 
  getWorkspaceVariables, 
  GetWorkspaceVariablesArgs, 
  setWorkspaceEnvironmentVariables, 
  updateWorkspaceVariable } from "../../src/hashicorpcloudplatform";

// const getOrganizationReposToUpdate = (repos: github_repo_info[], repo_property_values: RepositoryPropertyValues): github_repo_info[] => {
//   const repos_to_update: github_repo_info[] = [];

//   for(const repo of repos) {
//     const property_value = repo_property_values.getPropertyValueForRepository(repo.id, 'REQUIRES_ACCESS_KEY_UPDATE');
//     if (typeof property_value === "string" && property_value === "YES") {
//       repos_to_update.push(repo);
//     }
//   }

//   return repos_to_update;
// }

// const getVariablesToCreate = (map: Map<string, string>, data: any[]): string[] => {
//   const variables: string[] = [];

//   const existingKeys = data.map(d => d?.attributes?.key); 

//   for (const [key, value] of map) {
//     if(!existingKeys.includes(key)) {
//       variables.push(key);
//     }
//   }

//   return variables;
// }

// const getVariablesToUpdate = (map: Map<string, string>, data: any[]): any[] => {
//   const objs = data.filter((d) => map.has(d?.attributes?.key)); 

//   return objs;
// }

(async () => {
  let token = process.env.TF_TOKEN_app_terraform_io;
    if(!token) {
      token = "";
    }
  const variable_values: Map<string, any> = new Map<string, any>();
  variable_values.set("TFC_AZURE_PROVIDER_AUTH", true);
  variable_values.set("ARM_TENANT_ID", "xyz");
  variable_values.set("ARM_SUBSCRIPTION_ID", "xyz");
  variable_values.set("TFC_AZURE_RUN_CLIENT_ID", "xyz");
  variable_values.set("test2", "xyz");
  const org = "broyden-sandbox3";
  const workspace = "AZURE-ENTRA-ID-WORKSPACE-Development";
  await setWorkspaceEnvironmentVariables(org, workspace, token, variable_values);
  // console.log("HASHICORP TESTING");
  //   let token = process.env.TF_TOKEN_app_terraform_io;
  //   if(!token) {
  //     token = "";
  //   }
  //   console.log(`process.env.TF_TOKEN_app_terraform_io=${token}`);
  //   type hashicorpCloudPlatformApiArgs = {
  //     terraform_cloud_org_name: string;
  //     terraform_cloud_token: string;
  //   };

  //   const args: CreateWorkspaceProjectsArgs = {
  //     terraform_cloud_org_name: "broyden-sandbox3",
  //     terraform_cloud_token: token,
  //     terraform_cloud_project_name: "ebpub-admanager",
  //     workspaces_to_create: []
  //   };

  //   const getWorkspaceArgs: GetWorkspaceArgs = {
  //     terraform_cloud_org_name: "broyden-sandbox3",
  //     terraform_cloud_token: token,
  //     workspace_name: "AZURE-ENTRA-ID-WORKSPACE-Development",
  //   };
    
  //   const getWorkspaceVariablesArgs: GetWorkspaceVariablesArgs = {
  //     terraform_cloud_org_name: "broyden-sandbox3",
  //     terraform_cloud_token: token,
  //     workspace_name: "AZURE-ENTRA-ID-WORKSPACE-Development",
  //   }

  //   const workspace = await getWorkspace(getWorkspaceArgs);
  //   const workspace_id = workspace?.data?.id;
  //   const variables = await getWorkspaceVariables(getWorkspaceVariablesArgs);
  //   const variables_to_create = getVariablesToCreate(variables_values, variables.data);
  //   const variables_to_update = getVariablesToUpdate(variables_values, variables.data)
  //   for (const variable of variables_to_update) {
  //     const updated_value = variables_values.get(variable?.attributes?.key);
  //     if (updated_value) {
  //       updateWorkspaceVariable(token, variable, updated_value);
  //     }
  //   }

  //   for (const variable of variables_to_create) {
  //     const value = variables_values.get(variable);
  //     if (value) {
  //       await createWorkspaceVariable(token, workspace_id, variable, value);
  //     }
  //   }
    
  //   // const organization = 'ebpublishing';
  //   // const environment_name = 'NewTest123';

  //   // if (!token) {
  //   //     return;
  //   // }
  //   // const helper = new GitHubHelper(token);
  //   // helper.Repository.setEnvironmentSecretByRepositoryName('ebpublishing', 'ebpublishing-admanager-aws-iam', 'Development', 'AZURE_APP_REGISTRATION_APP_ID', 'test');
  //   // helper.Repository.createRepositoryEnvironmentVariable('ebpublishing', 'ebpublishing-admanager-aws-iam', 'Development', 'AZURE_APP_REGISTRATION_TENANT_ID', 'test')
  //   // // await helper.setEnvironmentVariableBasedOnCustomPropertyValue(
  //   // //     {
  //   // //         organization,
  //   // //         property_name: 'REQUIRES_ACCESS_KEY_UPDATE',
  //   // //         selector: (property_value: string | undefined): boolean => { return typeof property_value === "string" && property_value === "YES"; },
  //   // //         environment_name,
  //   // //         key: 'MyTestKey',
  //   // //         value: 'MyTestValue',
  //   // //     }
  //   // // );

  //   // // await helper.setEnvironmentSecretBasedOnCustomPropertyValue(
  //   // //     {
  //   // //         organization,
  //   // //         property_name: 'REQUIRES_ACCESS_KEY_UPDATE',
  //   // //         selector: selectValueEqualsYes,
  //   // //         environment_name,
  //   // //         key: 'MyTestSecretKey12',
  //   // //         value: 'MyTestValue12',
  //   // //     }
  //   // // );

  //   // console.log('hello');
  //   // // const manager = new SecretsManager();
  //   // // const hasSecret = await manager.upsertSecret("MikeTest1", "value1234567890");
  //   // // console.log(hasSecret);
})();
