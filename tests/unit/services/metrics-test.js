import { set } from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

let sandbox, service;

module('Unit | Service | metrics', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    sandbox = sinon.createSandbox();

    service = this.owner.factoryFor('service:metrics').create();
    service.activateAdapters([
      {
        name: 'GoogleAnalytics',
        environments: ['all'],
        config: {
          id: 'UA-XXXX-Y',
        },
      },
      {
        name: 'Mixpanel',
        environments: ['all'],
        config: {
          token: '0f76c037-4d76-4fce-8a0f-a9a8f89d1453',
        },
      },
      {
        name: 'LocalDummyAdapter',
        environments: ['all'],
        config: {
          foo: 'bar',
        },
      },
    ]);
  });

  hooks.afterEach(function () {
    sandbox.restore();
    delete window.ga;
    delete window.mixpanel;
    delete window.FastBoot;
  });

  test('it activates local adapters', function (assert) {
    assert.ok(
      service._adapters.LocalDummyAdapter,
      'it activated the LocalDummyAdapter'
    );
    assert.equal(
      service._adapters.LocalDummyAdapter.config.foo,
      'bar',
      'it passes config options to the LocalDummyAdapter'
    );
  });

  test('#activateAdapters activates an array of adapters', function (assert) {
    assert.ok(
      service._adapters.GoogleAnalytics,
      'it activated the GoogleAnalytics adapter'
    );
    assert.equal(
      service._adapters.GoogleAnalytics.config.id,
      'UA-XXXX-Y',
      'it passes config options to the GoogleAnalytics adapter'
    );
  });

  test('#activateAdapters is idempotent', function (assert) {
    service.activateAdapters([
      {
        name: 'GoogleAnalytics',
        environments: ['all'],
        config: {
          id: 'I like pie',
        },
      },
      {
        name: 'Mixpanel',
        environments: ['all'],
        config: {
          id: 'I like pie',
        },
      },
      {
        name: 'LocalDummyAdapter',
        environments: ['all'],
        config: {
          id: 'I like pie',
        },
      },
    ]);
    assert.equal(
      service._adapters.GoogleAnalytics.config.id,
      'UA-XXXX-Y',
      'it does not override the GoogleAnalytics adapter'
    );
    assert.equal(
      service._adapters.Mixpanel.config.token,
      '0f76c037-4d76-4fce-8a0f-a9a8f89d1453',
      'it does not override the Mixpanel adapter'
    );
    assert.equal(
      service._adapters.LocalDummyAdapter.config.foo,
      'bar',
      'it does not override the LocalDummyAdapter'
    );
  });

  test('#invoke invokes the named method on activated adapters', function (assert) {
    const MixpanelStub = sandbox.stub(window.mixpanel, 'identify');
    const GoogleAnalyticsStub = sandbox.stub(window, 'ga');
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'identify'
    );
    const MixpanelSpy = sandbox.spy(service._adapters.Mixpanel, 'identify');
    const opts = {
      userId: '1e810c197e',
      name: 'Bill Limbergh',
      email: 'bill@initech.com',
    };
    service.invoke('identify', opts);

    assert.ok(
      GoogleAnalyticsSpy.calledOnce,
      'it invokes the identify method on the adapter'
    );
    assert.ok(
      GoogleAnalyticsSpy.calledWith(opts),
      'it invokes with the correct arguments'
    );
    assert.ok(
      GoogleAnalyticsStub.calledOnce,
      'it invoked the GoogleAnalytics method'
    );
    assert.ok(
      MixpanelSpy.calledOnce,
      'it invokes the identify method on the adapter'
    );
    assert.ok(
      MixpanelSpy.calledWith(opts),
      'it invokes with the correct arguments'
    );
    assert.ok(MixpanelStub.calledOnce, 'it invoked the Mixpanel method');
  });

  test('#invoke invokes the named method on a single activated adapter', function (assert) {
    const GoogleAnalyticsStub = sandbox.stub(window, 'ga');
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'trackEvent'
    );
    const MixpanelSpy = sandbox.spy(service._adapters.Mixpanel, 'trackEvent');
    const opts = {
      userId: '1e810c197e',
      name: 'Bill Limbergh',
      email: 'bill@initech.com',
    };
    service.invoke('trackEvent', 'GoogleAnalytics', opts);

    assert.ok(
      GoogleAnalyticsSpy.calledOnce,
      'it invokes the track method on the adapter'
    );
    assert.ok(
      GoogleAnalyticsSpy.calledWith(opts),
      'it invokes with the correct arguments'
    );
    assert.ok(
      GoogleAnalyticsStub.withArgs('send').calledOnce,
      'it invoked the Google Analytics method'
    );
    assert.equal(MixpanelSpy.callCount, 0, 'it does not invoke other adapters');
  });

  test('#invoke invokes the named methods on a whitelist of activated adapters', function (assert) {
    const MixpanelStub = sandbox.stub(window.mixpanel, 'identify');
    const GoogleAnalyticsStub = sandbox.stub(window, 'ga');
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'identify'
    );
    const MixpanelSpy = sandbox.spy(service._adapters.Mixpanel, 'identify');
    const LocalDummyAdapterSpy = sandbox.spy(
      service._adapters.LocalDummyAdapter,
      'trackEvent'
    );
    const opts = {
      userId: '1e810c197e',
      name: 'Bill Limbergh',
      email: 'bill@initech.com',
    };
    service.invoke('identify', ['GoogleAnalytics', 'Mixpanel'], opts);

    assert.ok(
      GoogleAnalyticsSpy.calledOnce,
      'it invokes the identify method on the adapter'
    );
    assert.ok(
      GoogleAnalyticsSpy.calledWith(opts),
      'it invokes with the correct arguments'
    );
    assert.ok(
      GoogleAnalyticsStub.calledOnce,
      'it invoked the GoogleAnalytics method'
    );
    assert.ok(
      MixpanelSpy.calledOnce,
      'it invokes the identify method on the adapter'
    );
    assert.ok(
      MixpanelSpy.calledWith(opts),
      'it invokes with the correct arguments'
    );
    assert.ok(MixpanelStub.calledOnce, 'it invoked the Mixpanel method');
    assert.equal(
      LocalDummyAdapterSpy.callCount,
      0,
      'it does not invoke other adapters'
    );
  });

  test("#invoke doesn't error when asked to use a single deactivated adapter", function (assert) {
    service.invoke('trackEvent', 'Trackmaster2000', {});
    assert.ok(true, 'No exception was thrown');
  });

  test('#invoke invokes the named method on a single activated adapter with no arguments', function (assert) {
    const GoogleAnalyticsStub = sandbox.stub(window, 'ga');
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'trackPage'
    );
    service.invoke('trackPage', 'GoogleAnalytics');

    assert.ok(
      GoogleAnalyticsSpy.calledOnce,
      'it invokes the track method on the adapter'
    );
    assert.ok(
      GoogleAnalyticsStub.withArgs('send').calledOnce,
      'it invoked the Google Analytics method'
    );
  });

  test('#invoke includes `context` properties', function (assert) {
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'trackPage'
    );

    set(service, 'context.userName', 'Jimbo');
    service.invoke('trackPage', 'GoogleAnalytics', {
      page: 'page/1',
      title: 'page one',
    });

    assert.ok(
      GoogleAnalyticsSpy.calledWith({
        userName: 'Jimbo',
        page: 'page/1',
        title: 'page one',
      }),
      'it includes context properties'
    );
  });

  test('#invoke does not leak options between calls', function (assert) {
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'trackPage'
    );

    set(service, 'context.userName', 'Jimbo');
    service.invoke('trackPage', 'GoogleAnalytics', {
      page: 'page/1',
      title: 'page one',
      callOne: true,
    });
    service.invoke('trackPage', 'GoogleAnalytics', {
      page: 'page/1',
      title: 'page one',
      callTwo: true,
    });

    assert.ok(
      GoogleAnalyticsSpy.calledWith({
        userName: 'Jimbo',
        page: 'page/1',
        title: 'page one',
        callTwo: true,
      }),
      'it does not include options from previous call'
    );
  });

  test('it can be disabled', function (assert) {
    const GoogleAnalyticsSpy = sandbox.spy(
      service._adapters.GoogleAnalytics,
      'trackPage'
    );

    set(service, 'enabled', false);
    service.invoke('trackPage', 'GoogleAnalytics', {
      page: 'page/1',
      title: 'page one',
    });

    assert.notOk(GoogleAnalyticsSpy.called, 'it does not call adapters');
  });

  test('it implements standard contracts', function (assert) {
    delete window.mixpanel.toString;
    sandbox.stub(window.mixpanel);
    sandbox.stub(window, 'ga');
    const spy = sandbox.spy(service, 'invoke');
    const expectedContracts = ['identify', 'alias', 'trackEvent', 'trackPage'];

    expectedContracts.forEach((contractName) => {
      service[contractName]({
        foo: 'bar',
      });
    });

    assert.equal(spy.callCount, 4, 'it implements standard contracts');
  });

  test('it does not activate adapters that are not in the current app environment', function (assert) {
    service.activateAdapters([
      {
        name: 'GoogleAnalytics',
        config: {
          id: 'UA-XXXX-Y',
        },
      },
      {
        name: 'LocalDummyAdapter',
        environments: ['production'],
        config: {
          foo: 'bar',
        },
      },
    ]);

    assert.ok(
      service._adapters.GoogleAnalytics,
      'it activated the GoogleAnalytics adapter'
    );
    assert.notOk(
      service._adapters.LocalDummyAdapter,
      'it did not activate the LocalDummyAdapter'
    );
  });

  test('when in FastBoot env, it does not activate adapters that are not FastBoot-enabled', function (assert) {
    window.FastBoot = true;
    service.activateAdapters([
      {
        name: 'GoogleAnalytics',
        config: {
          id: 'UA-XXXX-Y',
        },
      },
      {
        name: 'LocalDummyAdapter',
        config: {
          foo: 'bar',
        },
      },
    ]);

    assert.notOk(
      service._adapters.GoogleAnalytics,
      'it did not activate the GoogleAnalytics adapter'
    );
    assert.ok(
      service._adapters.LocalDummyAdapter,
      'it activated the LocalDummyAdapter'
    );
  });
});
