import { public_key_info } from "./github_types";

export class RepositoryPublicKeyInfoCollection {
    private _map: Map<string, public_key_info>;
  
    constructor() {
      this._map = new Map<string, public_key_info>();
    }
  
    public add(repository_name: string, public_key_info: public_key_info): void {
      this._map.set(repository_name, public_key_info);
    }
  
    public get(repository_name: string): public_key_info | undefined {
      return this._map.get(repository_name);
    }
}

export class RepositoryPropertyValues {
    private _propertyValues: Map<number, Map<string, string>>;
  
    constructor() {
      this._propertyValues = new Map<number, Map<string, string>>();
    }
  
    public add(repository_id: number, property_name: string, property_value: string) {
      if(this._propertyValues.has(repository_id)) {
        this._propertyValues.get(repository_id)?.set(property_name, property_value);
      } else {
        const map = new Map<string, string>([[property_name, property_value]]);
        this._propertyValues.set(repository_id, map);
      }
    }
  
    public hasPropertyValueForRepository(repository_id: number, property_name: string): boolean | undefined {
      return this._propertyValues.has(repository_id) && this._propertyValues.get(repository_id)?.has(property_name);
    }
  
    public getPropertyValueForRepository(repository_id: number, property_name: string): string | undefined {
      return this._propertyValues.get(repository_id)?.get(property_name);
    }
}