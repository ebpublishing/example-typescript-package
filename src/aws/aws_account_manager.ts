import { Services } from './services';

export class AwsAccountsManager {
  readonly Services: Services;
  constructor() {
    this.Services = new Services();
  }
}