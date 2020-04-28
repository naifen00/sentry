import React from 'react';
import {Integrations} from '@sentry/apm';

import getDisplayName from 'app/utils/getDisplayName';

type InjectedProps = {
  finishProfile: () => void;
};

export default function withProfiler<P extends InjectedProps>(
  WrappedComponent: React.ComponentType<P>
) {
  const componentDisplayName = getDisplayName(WrappedComponent);

  return class extends React.Component<Omit<P, keyof InjectedProps>> {
    static displayName = `profiler(${componentDisplayName})`;
    constructor(props) {
      super(props);

      console.warn('loadingindicator mount');
    }

    componentWillUnmount() {
      this.finishProfile();
      console.warn('loadingindicator unmount');
    }

    activity: number | null = Integrations.Tracing.pushActivity(
      componentDisplayName,
      {
        data: {},
        op: 'react',
        description: `<${componentDisplayName}>`,
      },
      {
        autoPopAfter: 2000, // After this timeout we'll pop this activity regardless
      }
    );

    // For whatever reason it's not guaranteed that `finishProfile` will be
    // called, that's why we need the previously described timeout to make
    // sure our transaction will be finished.

    finishProfile = () => {
      if (!this.activity) {
        return;
      }

      Integrations.Tracing.popActivity(this.activity);
      this.activity = null;
    };

    render() {
      return (
        <WrappedComponent {...(this.props as P)} finishProfile={this.finishProfile} />
      );
    }
  };
}
