import { SecretsManager } from "../../src/aws/secrets_manager";


(async () => {
    console.log('hello');
    const manager = new SecretsManager();
    const hasSecret = await manager.upsertSecret("MikeTest1", "value1234567890");
    console.log(hasSecret);
})();