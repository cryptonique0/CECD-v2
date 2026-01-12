// Open API & extensibility service for sensors, data sources, and partner systems
// Provides registration, schema validation, and integration hooks
export type ExternalIntegration = {
  id: string;
  name: string;
  type: 'sensor' | 'dataSource' | 'partner';
  endpoint: string;
  schema: object;
  enabled: boolean;
};

export class OpenAPIExtensibilityService {
  private integrations: ExternalIntegration[] = [];

  registerIntegration(integration: ExternalIntegration) {
    this.integrations.push(integration);
  }

  getIntegrations(): ExternalIntegration[] {
    return this.integrations;
  }

  enableIntegration(id: string) {
    const i = this.integrations.find(x => x.id === id);
    if (i) i.enabled = true;
  }

  disableIntegration(id: string) {
    const i = this.integrations.find(x => x.id === id);
    if (i) i.enabled = false;
  }

  // Extensible hooks for schema validation, API registration, and partner onboarding
  // ...API/model integration stubs...
}
