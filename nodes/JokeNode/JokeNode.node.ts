import {
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
		icon: 'file:jokenode.svg',
		outputs: ['main'],
		properties: [
			// Category selection (required)
			{
				displayName: 'Joke Category',
				name: 'category',
				type: 'multiOptions',
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
				default: ['Any'],
				required: true,
				description: 'The category of joke to get',
			},
			// Optional parameters
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					// Joke type
					{
						displayName: 'Joke Type',
						name: 'type',
						type: 'options',
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
						name: 'language',
						type: 'options',
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
						default: 'en',
						description: 'The language of the joke',
					},
					// Blacklist Flags (Multiple)
					{
						displayName: 'Blacklist Flags',
						name: 'blacklistFlags',
						type: 'multiOptions',
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
						default: false,
						description: 'Whether to enable safe mode by excluding all flags',
					},
					// Search string
					{
						displayName: 'Search String',
						name: 'searchString',
						type: 'string',
						default: '',
						description: 'A search string to find jokes with',
					},
				],
			},
		],
		version: 1,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Process each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get the required category parameter
				const categories = this.getNodeParameter('category', itemIndex, ['Any']) as string[];

				// Get optional parameters
				const options = this.getNodeParameter('options', itemIndex, {}) as {
					language?: string;
					type?: string;
					blacklistFlags?: string[];
					safeMode?: boolean;
					searchString?: string;
				};

				// Format the category for the URL
				let categoryPath;

				// Handle 'Any' category or empty selection
				if (categories.includes('Any')) {
					categoryPath = 'Any';
				} else {
					// Join multiple categories with a comma for the API
					categoryPath = categories.join(',');
				}

				// Build the URL and query parameters
				const endpoint = `https://v2.jokeapi.dev/joke/${categoryPath}`;
				const queryParameters: Record<string, string | boolean> = {};

				// Add optional parameters if they are set
				if (options.language && options.language !== 'en') {
					queryParameters.lang = options.language;
				}

				if (options.type && options.type !== 'Any') {
					queryParameters.type = options.type;
				}

				if (options.blacklistFlags && options.blacklistFlags.length > 0) {
					queryParameters.blacklistFlags = options.blacklistFlags.join(',');
				}

				if (options.safeMode) {
					queryParameters.safe = options.safeMode.toString();
				}

				if (options.searchString) {
					queryParameters.contains = options.searchString;
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
