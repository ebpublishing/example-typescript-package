export type github_repo_info = {
    id: number;
    name: string;
};

export type repo_variable_info = {
    name: string;
    value: string;
}

export type public_key_info = {
    key_id: string,
    key: string
}

export type environment_variable = {
  name: string,
  value: any,
  created_at: string,
  updated_at: string,
  visibility: string,
}

export type label = {
  id: number,
  name: string,
  type: string,
}

export type self_hosted_runner = {
  id: number,
  name: string,
  os: string,
  status: string,
  busy: boolean,
  labels: label[],
}