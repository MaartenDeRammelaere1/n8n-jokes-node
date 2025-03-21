import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class JokeNode implements INodeType {
	description: INodeTypeDescription = {
		defaults: {
			name: 'Joke Node',
		},
		description: 'Gets a Joke from the JokeAPI',
		displayName: 'Joke Node',
		group: ['transform'],
		inputs: ['main'],
		name: 'jokeNode',
		outputs: ['main'],
		properties: [
			// First define the resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Joke',
						value: 'joke',
					},
				],
				default: 'joke',
			},
			// Then define operations for the joke resource
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['joke'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a random joke',
						action: 'Get a random joke',
					},
				],
				default: 'get',
			},
			// Category selection
			{
				displayName: 'Joke Category',
				name: 'category',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['joke'],
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Any',
						value: 'Any',
					},
					{
						name: 'Christmas',
						value: 'Christmas',
					},
					{
						name: 'Dark',
						value: 'Dark',
					},
					{
						name: 'Misc',
						value: 'Misc',
					},
					{
						name: 'Programming',
						value: 'Programming',
					},
					{
						name: 'Pun',
						value: 'Pun',
					},
					{
						name: 'Spooky',
						value: 'Spooky',
					},
				],
				default: 'Any',
			},
			// Joke type
			{
				displayName: 'Joke Type',
				name: 'type',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['joke'],
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Any',
						value: 'Any',
					},
					{
						name: 'Single',
						value: 'single',
					},
					{
						name: 'Two Part',
						value: 'twopart',
					},
				],
				default: 'Any',
				description: 'The type of joke to get',
			},
			// Language selection
			{
				displayName: 'Language',
				default: 'en',
				description: 'The language of the joke',
				displayOptions: {
					show: {
						resource: ['joke'],
						operation: ['get'],
					},
				},
				name: 'language',
				options: [
					{
						name: 'Czech',
						value: 'cs',
					},
					{
						name: 'English',
						value: 'en',
					},
					{
						name: 'French',
						value: 'fr',
					},
					{
						name: 'German',
						value: 'de',
					},
					{
						name: 'Portuguese',
						value: 'pt',
					},
					{
						name: 'Spanish',
						value: 'es',
					},
				],
				type: 'options',
			},
			// Blacklist Flags (Multiple)
			{
				displayName: 'Blacklist Flags',
				name: 'blacklistFlags',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['joke'],
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Explicit',
						value: 'explicit',
					},
					{
						name: 'NSFW',
						value: 'nsfw',
					},
					{
						name: 'Political',
						value: 'political',
					},
					{
						name: 'Racist',
						value: 'racist',
					},
					{
						name: 'Religious',
						value: 'religious',
					},
					{
						name: 'Sexist',
						value: 'sexist',
					},
				],
				default: [],
				description: 'Flags to blacklist from the returned jokes',
			},
			{
				displayName: 'Safe Mode',
				name: 'safeMode',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['joke'],
						operation: ['get'],
					},
				},
				default: false,
				description: 'Whether to enable safe mode by excluding all flags',
			},
			// Search string
			{
				displayName: 'Search String',
				name: 'searchString',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['joke'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'A search string to find jokes with',
			},
		],
		requestDefaults: {
			baseURL: 'https://v2.jokeapi.dev',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		version: 1,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Process each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (resource === 'joke' && operation === 'get') {
					// Get all the parameters
					const category = this.getNodeParameter('category', itemIndex) as string;
					const language = this.getNodeParameter('language', itemIndex) as string;
					const type = this.getNodeParameter('type', itemIndex) as string;
					const blacklistFlags = this.getNodeParameter('blacklistFlags', itemIndex, []) as string[];
					const safeMode = this.getNodeParameter('safeMode', itemIndex, false) as boolean;
					const searchString = this.getNodeParameter('searchString', itemIndex, '') as string;

					// Build the URL and query parameters
					let endpoint = `/joke/${category}`;
					const queryParameters: Record<string, string | string[] | boolean> = {};

					// Add parameters if they are set
					if (language !== 'en') {
						queryParameters.lang = language;
					}

					if (type !== 'Any') {
						queryParameters.type = type;
					}

					if (blacklistFlags.length > 0) {
						queryParameters.blacklistFlags = blacklistFlags.join(',');
					}

					if (safeMode) {
						queryParameters.safe = true;
					}

					if (searchString) {
						queryParameters.contains = searchString;
					}

					// Make the API request
					const responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: endpoint,
						qs: queryParameters,
						json: true,
					});

					returnData.push({
						json: responseData,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
