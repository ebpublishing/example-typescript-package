import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { Services } from './services';

export class KubernetesClusterManager {
  readonly Services: Services;
  constructor() {
    const kc = new KubeConfig();
    const k8sApi: CoreV1Api = kc.makeApiClient(CoreV1Api);
    this.Services = new Services(k8sApi);
  }
}