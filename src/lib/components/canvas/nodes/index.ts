import type { Component } from 'svelte';
import TriggerNode from './TriggerNode.svelte';
import ToolNode from './ToolNode.svelte';
import ServiceNode from './ServiceNode.svelte';
import AgentNode from './AgentNode.svelte';
import AssetInputNode from './AssetInputNode.svelte';
import TransformNode from './TransformNode.svelte';
import ConditionNode from './ConditionNode.svelte';
import OutputNode from './OutputNode.svelte';

export const nodeTypes: Record<string, Component> = {
	trigger: TriggerNode,
	tool: ToolNode,
	service: ServiceNode,
	agent: AgentNode,
	assetInput: AssetInputNode,
	transform: TransformNode,
	condition: ConditionNode,
	output: OutputNode
};
