import { SecretsManagerClient, ListSecretsCommand, ListSecretsCommandInput, CreateSecretCommand, UpdateSecretCommand } from "@aws-sdk/client-secrets-manager"; // ES Modules import

export class SecretsManager {
    private _client: SecretsManagerClient;

    public constructor() {
        this._client = new SecretsManagerClient({});
    }

    public upsertSecret = async (name: string, value: string): Promise<void> => {
        if(await this.hasSecret(name)) {
            await this.updateSecret(name, value);
        } else {
            await this.createSecret(name, value);
        }
    }

    private createSecret = async (name: string, value: string): Promise<void> => {
        const input = {
        //ClientRequestToken: "EXAMPLE1-90ab-cdef-fedc-ba987SECRET1",
        //Description: "My test database secret created with the CLI",
        Name: name,
        SecretString: value,
        };
        const command = new CreateSecretCommand(input);
        const response = await this._client.send(command);
    }

    private updateSecret = async (id: string, value: string): Promise<void> => {
        const input = {
        SecretId: id,
        SecretString: value
        };
        const command = new UpdateSecretCommand(input);
        const response = await this._client.send(command);
    }

    private hasSecret = async (name: string): Promise<boolean> => {
        const input: ListSecretsCommandInput = { 
            IncludePlannedDeletion: true,
            MaxResults: 100,
            Filters: [
                { 
                Key: "name",
                Values: [name],
                },
            ],
            SortOrder: "asc",
            SortBy: "name",
        };
        const command = new ListSecretsCommand(input);
        const response = await this._client.send(command);
        console.log(JSON.stringify(response));
        if (response.SecretList && response?.SecretList?.length === 1) {
            return true;
        } 

        return false;
    }
}