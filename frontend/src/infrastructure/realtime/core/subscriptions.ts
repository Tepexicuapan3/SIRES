import type {
  RealtimeClient,
  RealtimeEventHandler,
} from "@realtime/core/client";

export interface RealtimeFeatureSubscriptions {
  feature: string;
  eventHandlers: Record<string, RealtimeEventHandler>;
}

export interface RealtimeSubscriptionsRegistry {
  features: Record<string, RealtimeFeatureSubscriptions>;
}

export const createRealtimeSubscriptionsRegistry = (
  subscriptions: RealtimeFeatureSubscriptions[],
): RealtimeSubscriptionsRegistry => {
  const features: Record<string, RealtimeFeatureSubscriptions> = {};

  for (const definition of subscriptions) {
    features[definition.feature] = definition;
  }

  return { features };
};

export const bindFeatureSubscriptions = (
  client: RealtimeClient,
  subscriptions: RealtimeFeatureSubscriptions,
): (() => void) => {
  const unsubscribers = Object.entries(subscriptions.eventHandlers).map(
    ([eventType, handler]) => client.subscribe(eventType, handler),
  );

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
};

export const bindSubscriptionsRegistry = (
  client: RealtimeClient,
  registry: RealtimeSubscriptionsRegistry,
): (() => void) => {
  const featureUnsubscribers = Object.values(registry.features).map(
    (subscriptions) => bindFeatureSubscriptions(client, subscriptions),
  );

  return () => {
    for (const unsubscribe of featureUnsubscribers) {
      unsubscribe();
    }
  };
};
