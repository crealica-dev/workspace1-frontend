import type { Component } from 'svelte';
import StatusEdge from './StatusEdge.svelte';

export const edgeTypes: Record<string, Component> = {
	status: StatusEdge
};
