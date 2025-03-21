import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JokeCredentialsApi implements ICredentialType {
	name = 'jokeCredentialsApi';
	displayName = 'Joke Credentials API';
	properties: INodeProperties[] = [];
}
