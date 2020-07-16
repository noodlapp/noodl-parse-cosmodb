"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getControllers = getControllers;
exports.getLoggerController = getLoggerController;
exports.getFilesController = getFilesController;
exports.getUserController = getUserController;
exports.getCacheController = getCacheController;
exports.getParseGraphQLController = getParseGraphQLController;
exports.getAnalyticsController = getAnalyticsController;
exports.getLiveQueryController = getLiveQueryController;
exports.getDatabaseController = getDatabaseController;
exports.getHooksController = getHooksController;
exports.getPushController = getPushController;
exports.getAuthDataManager = getAuthDataManager;
exports.getDatabaseAdapter = getDatabaseAdapter;

var _Auth = _interopRequireDefault(require("../Adapters/Auth"));

var _Options = require("../Options");

var _AdapterLoader = require("../Adapters/AdapterLoader");

var _defaults = _interopRequireDefault(require("../defaults"));

var _url = _interopRequireDefault(require("url"));

var _LoggerController = require("./LoggerController");

var _FilesController = require("./FilesController");

var _HooksController = require("./HooksController");

var _UserController = require("./UserController");

var _CacheController = require("./CacheController");

var _LiveQueryController = require("./LiveQueryController");

var _AnalyticsController = require("./AnalyticsController");

var _PushController = require("./PushController");

var _PushQueue = require("../Push/PushQueue");

var _PushWorker = require("../Push/PushWorker");

var _DatabaseController = _interopRequireDefault(require("./DatabaseController"));

var _SchemaCache = _interopRequireDefault(require("./SchemaCache"));

var _GridFSBucketAdapter = require("../Adapters/Files/GridFSBucketAdapter");

var _WinstonLoggerAdapter = require("../Adapters/Logger/WinstonLoggerAdapter");

var _InMemoryCacheAdapter = require("../Adapters/Cache/InMemoryCacheAdapter");

var _AnalyticsAdapter = require("../Adapters/Analytics/AnalyticsAdapter");

var _MongoStorageAdapter = _interopRequireDefault(require("../Adapters/Storage/Mongo/MongoStorageAdapter"));

var _PostgresStorageAdapter = _interopRequireDefault(require("../Adapters/Storage/Postgres/PostgresStorageAdapter"));

var _pushAdapter = _interopRequireDefault(require("@parse/push-adapter"));

var _ParseGraphQLController = _interopRequireDefault(require("./ParseGraphQLController"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getControllers(options) {
  const loggerController = getLoggerController(options);
  const filesController = getFilesController(options);
  const userController = getUserController(options);
  const {
    pushController,
    hasPushScheduledSupport,
    hasPushSupport,
    pushControllerQueue,
    pushWorker
  } = getPushController(options);
  const cacheController = getCacheController(options);
  const analyticsController = getAnalyticsController(options);
  const liveQueryController = getLiveQueryController(options);
  const databaseController = getDatabaseController(options, cacheController);
  const hooksController = getHooksController(options, databaseController);
  const authDataManager = getAuthDataManager(options);
  const parseGraphQLController = getParseGraphQLController(options, {
    databaseController,
    cacheController
  });
  return {
    loggerController,
    filesController,
    userController,
    pushController,
    hasPushScheduledSupport,
    hasPushSupport,
    pushWorker,
    pushControllerQueue,
    analyticsController,
    cacheController,
    parseGraphQLController,
    liveQueryController,
    databaseController,
    hooksController,
    authDataManager
  };
}

function getLoggerController(options) {
  const {
    appId,
    jsonLogs,
    logsFolder,
    verbose,
    logLevel,
    maxLogFiles,
    silent,
    loggerAdapter
  } = options;
  const loggerOptions = {
    jsonLogs,
    logsFolder,
    verbose,
    logLevel,
    silent,
    maxLogFiles
  };
  const loggerControllerAdapter = (0, _AdapterLoader.loadAdapter)(loggerAdapter, _WinstonLoggerAdapter.WinstonLoggerAdapter, loggerOptions);
  return new _LoggerController.LoggerController(loggerControllerAdapter, appId, loggerOptions);
}

function getFilesController(options) {
  const {
    appId,
    databaseURI,
    filesAdapter,
    databaseAdapter,
    preserveFileName,
    fileKey
  } = options;

  if (!filesAdapter && databaseAdapter) {
    throw 'When using an explicit database adapter, you must also use an explicit filesAdapter.';
  }

  const filesControllerAdapter = (0, _AdapterLoader.loadAdapter)(filesAdapter, () => {
    return new _GridFSBucketAdapter.GridFSBucketAdapter(databaseURI, {}, fileKey);
  });
  return new _FilesController.FilesController(filesControllerAdapter, appId, {
    preserveFileName
  });
}

function getUserController(options) {
  const {
    appId,
    emailAdapter,
    verifyUserEmails
  } = options;
  const emailControllerAdapter = (0, _AdapterLoader.loadAdapter)(emailAdapter);
  return new _UserController.UserController(emailControllerAdapter, appId, {
    verifyUserEmails
  });
}

function getCacheController(options) {
  const {
    appId,
    cacheAdapter,
    cacheTTL,
    cacheMaxSize
  } = options;
  const cacheControllerAdapter = (0, _AdapterLoader.loadAdapter)(cacheAdapter, _InMemoryCacheAdapter.InMemoryCacheAdapter, {
    appId: appId,
    ttl: cacheTTL,
    maxSize: cacheMaxSize
  });
  return new _CacheController.CacheController(cacheControllerAdapter, appId);
}

function getParseGraphQLController(options, controllerDeps) {
  return new _ParseGraphQLController.default(_objectSpread({
    mountGraphQL: options.mountGraphQL
  }, controllerDeps));
}

function getAnalyticsController(options) {
  const {
    analyticsAdapter
  } = options;
  const analyticsControllerAdapter = (0, _AdapterLoader.loadAdapter)(analyticsAdapter, _AnalyticsAdapter.AnalyticsAdapter);
  return new _AnalyticsController.AnalyticsController(analyticsControllerAdapter);
}

function getLiveQueryController(options) {
  return new _LiveQueryController.LiveQueryController(options.liveQuery);
}

function getDatabaseController(options, cacheController) {
  const {
    databaseURI,
    databaseOptions,
    collectionPrefix,
    schemaCacheTTL,
    enableSingleSchemaCache
  } = options;
  let {
    databaseAdapter
  } = options;

  if ((databaseOptions || databaseURI && databaseURI !== _defaults.default.databaseURI || collectionPrefix !== _defaults.default.collectionPrefix) && databaseAdapter) {
    throw 'You cannot specify both a databaseAdapter and a databaseURI/databaseOptions/collectionPrefix.';
  } else if (!databaseAdapter) {
    databaseAdapter = getDatabaseAdapter(databaseURI, collectionPrefix, databaseOptions);
  } else {
    databaseAdapter = (0, _AdapterLoader.loadAdapter)(databaseAdapter);
  }

  return new _DatabaseController.default(databaseAdapter, new _SchemaCache.default(cacheController, schemaCacheTTL, enableSingleSchemaCache));
}

function getHooksController(options, databaseController) {
  const {
    appId,
    webhookKey
  } = options;
  return new _HooksController.HooksController(appId, databaseController, webhookKey);
}

function getPushController(options) {
  const {
    scheduledPush,
    push
  } = options;
  const pushOptions = Object.assign({}, push);
  const pushQueueOptions = pushOptions.queueOptions || {};

  if (pushOptions.queueOptions) {
    delete pushOptions.queueOptions;
  } // Pass the push options too as it works with the default


  const pushAdapter = (0, _AdapterLoader.loadAdapter)(pushOptions && pushOptions.adapter, _pushAdapter.default, pushOptions); // We pass the options and the base class for the adatper,
  // Note that passing an instance would work too

  const pushController = new _PushController.PushController();
  const hasPushSupport = !!(pushAdapter && push);
  const hasPushScheduledSupport = hasPushSupport && scheduledPush === true;
  const {
    disablePushWorker
  } = pushQueueOptions;
  const pushControllerQueue = new _PushQueue.PushQueue(pushQueueOptions);
  let pushWorker;

  if (!disablePushWorker) {
    pushWorker = new _PushWorker.PushWorker(pushAdapter, pushQueueOptions);
  }

  return {
    pushController,
    hasPushSupport,
    hasPushScheduledSupport,
    pushControllerQueue,
    pushWorker
  };
}

function getAuthDataManager(options) {
  const {
    auth,
    enableAnonymousUsers
  } = options;
  return (0, _Auth.default)(auth, enableAnonymousUsers);
}

function getDatabaseAdapter(databaseURI, collectionPrefix, databaseOptions) {
  let protocol;

  try {
    const parsedURI = _url.default.parse(databaseURI);

    protocol = parsedURI.protocol ? parsedURI.protocol.toLowerCase() : null;
  } catch (e) {
    /* */
  }

  switch (protocol) {
    case 'postgres:':
      return new _PostgresStorageAdapter.default({
        uri: databaseURI,
        collectionPrefix,
        databaseOptions
      });

    default:
      return new _MongoStorageAdapter.default({
        uri: databaseURI,
        collectionPrefix,
        mongoOptions: databaseOptions
      });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Db250cm9sbGVycy9pbmRleC5qcyJdLCJuYW1lcyI6WyJnZXRDb250cm9sbGVycyIsIm9wdGlvbnMiLCJsb2dnZXJDb250cm9sbGVyIiwiZ2V0TG9nZ2VyQ29udHJvbGxlciIsImZpbGVzQ29udHJvbGxlciIsImdldEZpbGVzQ29udHJvbGxlciIsInVzZXJDb250cm9sbGVyIiwiZ2V0VXNlckNvbnRyb2xsZXIiLCJwdXNoQ29udHJvbGxlciIsImhhc1B1c2hTY2hlZHVsZWRTdXBwb3J0IiwiaGFzUHVzaFN1cHBvcnQiLCJwdXNoQ29udHJvbGxlclF1ZXVlIiwicHVzaFdvcmtlciIsImdldFB1c2hDb250cm9sbGVyIiwiY2FjaGVDb250cm9sbGVyIiwiZ2V0Q2FjaGVDb250cm9sbGVyIiwiYW5hbHl0aWNzQ29udHJvbGxlciIsImdldEFuYWx5dGljc0NvbnRyb2xsZXIiLCJsaXZlUXVlcnlDb250cm9sbGVyIiwiZ2V0TGl2ZVF1ZXJ5Q29udHJvbGxlciIsImRhdGFiYXNlQ29udHJvbGxlciIsImdldERhdGFiYXNlQ29udHJvbGxlciIsImhvb2tzQ29udHJvbGxlciIsImdldEhvb2tzQ29udHJvbGxlciIsImF1dGhEYXRhTWFuYWdlciIsImdldEF1dGhEYXRhTWFuYWdlciIsInBhcnNlR3JhcGhRTENvbnRyb2xsZXIiLCJnZXRQYXJzZUdyYXBoUUxDb250cm9sbGVyIiwiYXBwSWQiLCJqc29uTG9ncyIsImxvZ3NGb2xkZXIiLCJ2ZXJib3NlIiwibG9nTGV2ZWwiLCJtYXhMb2dGaWxlcyIsInNpbGVudCIsImxvZ2dlckFkYXB0ZXIiLCJsb2dnZXJPcHRpb25zIiwibG9nZ2VyQ29udHJvbGxlckFkYXB0ZXIiLCJXaW5zdG9uTG9nZ2VyQWRhcHRlciIsIkxvZ2dlckNvbnRyb2xsZXIiLCJkYXRhYmFzZVVSSSIsImZpbGVzQWRhcHRlciIsImRhdGFiYXNlQWRhcHRlciIsInByZXNlcnZlRmlsZU5hbWUiLCJmaWxlS2V5IiwiZmlsZXNDb250cm9sbGVyQWRhcHRlciIsIkdyaWRGU0J1Y2tldEFkYXB0ZXIiLCJGaWxlc0NvbnRyb2xsZXIiLCJlbWFpbEFkYXB0ZXIiLCJ2ZXJpZnlVc2VyRW1haWxzIiwiZW1haWxDb250cm9sbGVyQWRhcHRlciIsIlVzZXJDb250cm9sbGVyIiwiY2FjaGVBZGFwdGVyIiwiY2FjaGVUVEwiLCJjYWNoZU1heFNpemUiLCJjYWNoZUNvbnRyb2xsZXJBZGFwdGVyIiwiSW5NZW1vcnlDYWNoZUFkYXB0ZXIiLCJ0dGwiLCJtYXhTaXplIiwiQ2FjaGVDb250cm9sbGVyIiwiY29udHJvbGxlckRlcHMiLCJQYXJzZUdyYXBoUUxDb250cm9sbGVyIiwibW91bnRHcmFwaFFMIiwiYW5hbHl0aWNzQWRhcHRlciIsImFuYWx5dGljc0NvbnRyb2xsZXJBZGFwdGVyIiwiQW5hbHl0aWNzQWRhcHRlciIsIkFuYWx5dGljc0NvbnRyb2xsZXIiLCJMaXZlUXVlcnlDb250cm9sbGVyIiwibGl2ZVF1ZXJ5IiwiZGF0YWJhc2VPcHRpb25zIiwiY29sbGVjdGlvblByZWZpeCIsInNjaGVtYUNhY2hlVFRMIiwiZW5hYmxlU2luZ2xlU2NoZW1hQ2FjaGUiLCJkZWZhdWx0cyIsImdldERhdGFiYXNlQWRhcHRlciIsIkRhdGFiYXNlQ29udHJvbGxlciIsIlNjaGVtYUNhY2hlIiwid2ViaG9va0tleSIsIkhvb2tzQ29udHJvbGxlciIsInNjaGVkdWxlZFB1c2giLCJwdXNoIiwicHVzaE9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJwdXNoUXVldWVPcHRpb25zIiwicXVldWVPcHRpb25zIiwicHVzaEFkYXB0ZXIiLCJhZGFwdGVyIiwiUGFyc2VQdXNoQWRhcHRlciIsIlB1c2hDb250cm9sbGVyIiwiZGlzYWJsZVB1c2hXb3JrZXIiLCJQdXNoUXVldWUiLCJQdXNoV29ya2VyIiwiYXV0aCIsImVuYWJsZUFub255bW91c1VzZXJzIiwicHJvdG9jb2wiLCJwYXJzZWRVUkkiLCJ1cmwiLCJwYXJzZSIsInRvTG93ZXJDYXNlIiwiZSIsIlBvc3RncmVzU3RvcmFnZUFkYXB0ZXIiLCJ1cmkiLCJNb25nb1N0b3JhZ2VBZGFwdGVyIiwibW9uZ29PcHRpb25zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUFFTyxTQUFTQSxjQUFULENBQXdCQyxPQUF4QixFQUFxRDtBQUMxRCxRQUFNQyxnQkFBZ0IsR0FBR0MsbUJBQW1CLENBQUNGLE9BQUQsQ0FBNUM7QUFDQSxRQUFNRyxlQUFlLEdBQUdDLGtCQUFrQixDQUFDSixPQUFELENBQTFDO0FBQ0EsUUFBTUssY0FBYyxHQUFHQyxpQkFBaUIsQ0FBQ04sT0FBRCxDQUF4QztBQUNBLFFBQU07QUFDSk8sSUFBQUEsY0FESTtBQUVKQyxJQUFBQSx1QkFGSTtBQUdKQyxJQUFBQSxjQUhJO0FBSUpDLElBQUFBLG1CQUpJO0FBS0pDLElBQUFBO0FBTEksTUFNRkMsaUJBQWlCLENBQUNaLE9BQUQsQ0FOckI7QUFPQSxRQUFNYSxlQUFlLEdBQUdDLGtCQUFrQixDQUFDZCxPQUFELENBQTFDO0FBQ0EsUUFBTWUsbUJBQW1CLEdBQUdDLHNCQUFzQixDQUFDaEIsT0FBRCxDQUFsRDtBQUNBLFFBQU1pQixtQkFBbUIsR0FBR0Msc0JBQXNCLENBQUNsQixPQUFELENBQWxEO0FBQ0EsUUFBTW1CLGtCQUFrQixHQUFHQyxxQkFBcUIsQ0FBQ3BCLE9BQUQsRUFBVWEsZUFBVixDQUFoRDtBQUNBLFFBQU1RLGVBQWUsR0FBR0Msa0JBQWtCLENBQUN0QixPQUFELEVBQVVtQixrQkFBVixDQUExQztBQUNBLFFBQU1JLGVBQWUsR0FBR0Msa0JBQWtCLENBQUN4QixPQUFELENBQTFDO0FBQ0EsUUFBTXlCLHNCQUFzQixHQUFHQyx5QkFBeUIsQ0FBQzFCLE9BQUQsRUFBVTtBQUNoRW1CLElBQUFBLGtCQURnRTtBQUVoRU4sSUFBQUE7QUFGZ0UsR0FBVixDQUF4RDtBQUlBLFNBQU87QUFDTFosSUFBQUEsZ0JBREs7QUFFTEUsSUFBQUEsZUFGSztBQUdMRSxJQUFBQSxjQUhLO0FBSUxFLElBQUFBLGNBSks7QUFLTEMsSUFBQUEsdUJBTEs7QUFNTEMsSUFBQUEsY0FOSztBQU9MRSxJQUFBQSxVQVBLO0FBUUxELElBQUFBLG1CQVJLO0FBU0xLLElBQUFBLG1CQVRLO0FBVUxGLElBQUFBLGVBVks7QUFXTFksSUFBQUEsc0JBWEs7QUFZTFIsSUFBQUEsbUJBWks7QUFhTEUsSUFBQUEsa0JBYks7QUFjTEUsSUFBQUEsZUFkSztBQWVMRSxJQUFBQTtBQWZLLEdBQVA7QUFpQkQ7O0FBRU0sU0FBU3JCLG1CQUFULENBQ0xGLE9BREssRUFFYTtBQUNsQixRQUFNO0FBQ0oyQixJQUFBQSxLQURJO0FBRUpDLElBQUFBLFFBRkk7QUFHSkMsSUFBQUEsVUFISTtBQUlKQyxJQUFBQSxPQUpJO0FBS0pDLElBQUFBLFFBTEk7QUFNSkMsSUFBQUEsV0FOSTtBQU9KQyxJQUFBQSxNQVBJO0FBUUpDLElBQUFBO0FBUkksTUFTRmxDLE9BVEo7QUFVQSxRQUFNbUMsYUFBYSxHQUFHO0FBQ3BCUCxJQUFBQSxRQURvQjtBQUVwQkMsSUFBQUEsVUFGb0I7QUFHcEJDLElBQUFBLE9BSG9CO0FBSXBCQyxJQUFBQSxRQUpvQjtBQUtwQkUsSUFBQUEsTUFMb0I7QUFNcEJELElBQUFBO0FBTm9CLEdBQXRCO0FBUUEsUUFBTUksdUJBQXVCLEdBQUcsZ0NBQzlCRixhQUQ4QixFQUU5QkcsMENBRjhCLEVBRzlCRixhQUg4QixDQUFoQztBQUtBLFNBQU8sSUFBSUcsa0NBQUosQ0FBcUJGLHVCQUFyQixFQUE4Q1QsS0FBOUMsRUFBcURRLGFBQXJELENBQVA7QUFDRDs7QUFFTSxTQUFTL0Isa0JBQVQsQ0FDTEosT0FESyxFQUVZO0FBQ2pCLFFBQU07QUFDSjJCLElBQUFBLEtBREk7QUFFSlksSUFBQUEsV0FGSTtBQUdKQyxJQUFBQSxZQUhJO0FBSUpDLElBQUFBLGVBSkk7QUFLSkMsSUFBQUEsZ0JBTEk7QUFNSkMsSUFBQUE7QUFOSSxNQU9GM0MsT0FQSjs7QUFRQSxNQUFJLENBQUN3QyxZQUFELElBQWlCQyxlQUFyQixFQUFzQztBQUNwQyxVQUFNLHNGQUFOO0FBQ0Q7O0FBQ0QsUUFBTUcsc0JBQXNCLEdBQUcsZ0NBQVlKLFlBQVosRUFBMEIsTUFBTTtBQUM3RCxXQUFPLElBQUlLLHdDQUFKLENBQXdCTixXQUF4QixFQUFxQyxFQUFyQyxFQUF5Q0ksT0FBekMsQ0FBUDtBQUNELEdBRjhCLENBQS9CO0FBR0EsU0FBTyxJQUFJRyxnQ0FBSixDQUFvQkYsc0JBQXBCLEVBQTRDakIsS0FBNUMsRUFBbUQ7QUFDeERlLElBQUFBO0FBRHdELEdBQW5ELENBQVA7QUFHRDs7QUFFTSxTQUFTcEMsaUJBQVQsQ0FBMkJOLE9BQTNCLEVBQXdFO0FBQzdFLFFBQU07QUFBRTJCLElBQUFBLEtBQUY7QUFBU29CLElBQUFBLFlBQVQ7QUFBdUJDLElBQUFBO0FBQXZCLE1BQTRDaEQsT0FBbEQ7QUFDQSxRQUFNaUQsc0JBQXNCLEdBQUcsZ0NBQVlGLFlBQVosQ0FBL0I7QUFDQSxTQUFPLElBQUlHLDhCQUFKLENBQW1CRCxzQkFBbkIsRUFBMkN0QixLQUEzQyxFQUFrRDtBQUN2RHFCLElBQUFBO0FBRHVELEdBQWxELENBQVA7QUFHRDs7QUFFTSxTQUFTbEMsa0JBQVQsQ0FDTGQsT0FESyxFQUVZO0FBQ2pCLFFBQU07QUFBRTJCLElBQUFBLEtBQUY7QUFBU3dCLElBQUFBLFlBQVQ7QUFBdUJDLElBQUFBLFFBQXZCO0FBQWlDQyxJQUFBQTtBQUFqQyxNQUFrRHJELE9BQXhEO0FBQ0EsUUFBTXNELHNCQUFzQixHQUFHLGdDQUM3QkgsWUFENkIsRUFFN0JJLDBDQUY2QixFQUc3QjtBQUFFNUIsSUFBQUEsS0FBSyxFQUFFQSxLQUFUO0FBQWdCNkIsSUFBQUEsR0FBRyxFQUFFSixRQUFyQjtBQUErQkssSUFBQUEsT0FBTyxFQUFFSjtBQUF4QyxHQUg2QixDQUEvQjtBQUtBLFNBQU8sSUFBSUssZ0NBQUosQ0FBb0JKLHNCQUFwQixFQUE0QzNCLEtBQTVDLENBQVA7QUFDRDs7QUFFTSxTQUFTRCx5QkFBVCxDQUNMMUIsT0FESyxFQUVMMkQsY0FGSyxFQUdtQjtBQUN4QixTQUFPLElBQUlDLCtCQUFKO0FBQ0xDLElBQUFBLFlBQVksRUFBRTdELE9BQU8sQ0FBQzZEO0FBRGpCLEtBRUZGLGNBRkUsRUFBUDtBQUlEOztBQUVNLFNBQVMzQyxzQkFBVCxDQUNMaEIsT0FESyxFQUVnQjtBQUNyQixRQUFNO0FBQUU4RCxJQUFBQTtBQUFGLE1BQXVCOUQsT0FBN0I7QUFDQSxRQUFNK0QsMEJBQTBCLEdBQUcsZ0NBQ2pDRCxnQkFEaUMsRUFFakNFLGtDQUZpQyxDQUFuQztBQUlBLFNBQU8sSUFBSUMsd0NBQUosQ0FBd0JGLDBCQUF4QixDQUFQO0FBQ0Q7O0FBRU0sU0FBUzdDLHNCQUFULENBQ0xsQixPQURLLEVBRWdCO0FBQ3JCLFNBQU8sSUFBSWtFLHdDQUFKLENBQXdCbEUsT0FBTyxDQUFDbUUsU0FBaEMsQ0FBUDtBQUNEOztBQUVNLFNBQVMvQyxxQkFBVCxDQUNMcEIsT0FESyxFQUVMYSxlQUZLLEVBR2U7QUFDcEIsUUFBTTtBQUNKMEIsSUFBQUEsV0FESTtBQUVKNkIsSUFBQUEsZUFGSTtBQUdKQyxJQUFBQSxnQkFISTtBQUlKQyxJQUFBQSxjQUpJO0FBS0pDLElBQUFBO0FBTEksTUFNRnZFLE9BTko7QUFPQSxNQUFJO0FBQUV5QyxJQUFBQTtBQUFGLE1BQXNCekMsT0FBMUI7O0FBQ0EsTUFDRSxDQUFDb0UsZUFBZSxJQUNiN0IsV0FBVyxJQUFJQSxXQUFXLEtBQUtpQyxrQkFBU2pDLFdBRDFDLElBRUM4QixnQkFBZ0IsS0FBS0csa0JBQVNILGdCQUZoQyxLQUdBNUIsZUFKRixFQUtFO0FBQ0EsVUFBTSwrRkFBTjtBQUNELEdBUEQsTUFPTyxJQUFJLENBQUNBLGVBQUwsRUFBc0I7QUFDM0JBLElBQUFBLGVBQWUsR0FBR2dDLGtCQUFrQixDQUNsQ2xDLFdBRGtDLEVBRWxDOEIsZ0JBRmtDLEVBR2xDRCxlQUhrQyxDQUFwQztBQUtELEdBTk0sTUFNQTtBQUNMM0IsSUFBQUEsZUFBZSxHQUFHLGdDQUFZQSxlQUFaLENBQWxCO0FBQ0Q7O0FBQ0QsU0FBTyxJQUFJaUMsMkJBQUosQ0FDTGpDLGVBREssRUFFTCxJQUFJa0Msb0JBQUosQ0FBZ0I5RCxlQUFoQixFQUFpQ3lELGNBQWpDLEVBQWlEQyx1QkFBakQsQ0FGSyxDQUFQO0FBSUQ7O0FBRU0sU0FBU2pELGtCQUFULENBQ0x0QixPQURLLEVBRUxtQixrQkFGSyxFQUdZO0FBQ2pCLFFBQU07QUFBRVEsSUFBQUEsS0FBRjtBQUFTaUQsSUFBQUE7QUFBVCxNQUF3QjVFLE9BQTlCO0FBQ0EsU0FBTyxJQUFJNkUsZ0NBQUosQ0FBb0JsRCxLQUFwQixFQUEyQlIsa0JBQTNCLEVBQStDeUQsVUFBL0MsQ0FBUDtBQUNEOztBQVNNLFNBQVNoRSxpQkFBVCxDQUNMWixPQURLLEVBRVk7QUFDakIsUUFBTTtBQUFFOEUsSUFBQUEsYUFBRjtBQUFpQkMsSUFBQUE7QUFBakIsTUFBMEIvRSxPQUFoQztBQUVBLFFBQU1nRixXQUFXLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JILElBQWxCLENBQXBCO0FBQ0EsUUFBTUksZ0JBQWdCLEdBQUdILFdBQVcsQ0FBQ0ksWUFBWixJQUE0QixFQUFyRDs7QUFDQSxNQUFJSixXQUFXLENBQUNJLFlBQWhCLEVBQThCO0FBQzVCLFdBQU9KLFdBQVcsQ0FBQ0ksWUFBbkI7QUFDRCxHQVBnQixDQVNqQjs7O0FBQ0EsUUFBTUMsV0FBVyxHQUFHLGdDQUNsQkwsV0FBVyxJQUFJQSxXQUFXLENBQUNNLE9BRFQsRUFFbEJDLG9CQUZrQixFQUdsQlAsV0FIa0IsQ0FBcEIsQ0FWaUIsQ0FlakI7QUFDQTs7QUFDQSxRQUFNekUsY0FBYyxHQUFHLElBQUlpRiw4QkFBSixFQUF2QjtBQUNBLFFBQU0vRSxjQUFjLEdBQUcsQ0FBQyxFQUFFNEUsV0FBVyxJQUFJTixJQUFqQixDQUF4QjtBQUNBLFFBQU12RSx1QkFBdUIsR0FBR0MsY0FBYyxJQUFJcUUsYUFBYSxLQUFLLElBQXBFO0FBRUEsUUFBTTtBQUFFVyxJQUFBQTtBQUFGLE1BQXdCTixnQkFBOUI7QUFFQSxRQUFNekUsbUJBQW1CLEdBQUcsSUFBSWdGLG9CQUFKLENBQWNQLGdCQUFkLENBQTVCO0FBQ0EsTUFBSXhFLFVBQUo7O0FBQ0EsTUFBSSxDQUFDOEUsaUJBQUwsRUFBd0I7QUFDdEI5RSxJQUFBQSxVQUFVLEdBQUcsSUFBSWdGLHNCQUFKLENBQWVOLFdBQWYsRUFBNEJGLGdCQUE1QixDQUFiO0FBQ0Q7O0FBQ0QsU0FBTztBQUNMNUUsSUFBQUEsY0FESztBQUVMRSxJQUFBQSxjQUZLO0FBR0xELElBQUFBLHVCQUhLO0FBSUxFLElBQUFBLG1CQUpLO0FBS0xDLElBQUFBO0FBTEssR0FBUDtBQU9EOztBQUVNLFNBQVNhLGtCQUFULENBQTRCeEIsT0FBNUIsRUFBeUQ7QUFDOUQsUUFBTTtBQUFFNEYsSUFBQUEsSUFBRjtBQUFRQyxJQUFBQTtBQUFSLE1BQWlDN0YsT0FBdkM7QUFDQSxTQUFPLG1CQUFnQjRGLElBQWhCLEVBQXNCQyxvQkFBdEIsQ0FBUDtBQUNEOztBQUVNLFNBQVNwQixrQkFBVCxDQUNMbEMsV0FESyxFQUVMOEIsZ0JBRkssRUFHTEQsZUFISyxFQUlMO0FBQ0EsTUFBSTBCLFFBQUo7O0FBQ0EsTUFBSTtBQUNGLFVBQU1DLFNBQVMsR0FBR0MsYUFBSUMsS0FBSixDQUFVMUQsV0FBVixDQUFsQjs7QUFDQXVELElBQUFBLFFBQVEsR0FBR0MsU0FBUyxDQUFDRCxRQUFWLEdBQXFCQyxTQUFTLENBQUNELFFBQVYsQ0FBbUJJLFdBQW5CLEVBQXJCLEdBQXdELElBQW5FO0FBQ0QsR0FIRCxDQUdFLE9BQU9DLENBQVAsRUFBVTtBQUNWO0FBQ0Q7O0FBQ0QsVUFBUUwsUUFBUjtBQUNFLFNBQUssV0FBTDtBQUNFLGFBQU8sSUFBSU0sK0JBQUosQ0FBMkI7QUFDaENDLFFBQUFBLEdBQUcsRUFBRTlELFdBRDJCO0FBRWhDOEIsUUFBQUEsZ0JBRmdDO0FBR2hDRCxRQUFBQTtBQUhnQyxPQUEzQixDQUFQOztBQUtGO0FBQ0UsYUFBTyxJQUFJa0MsNEJBQUosQ0FBd0I7QUFDN0JELFFBQUFBLEdBQUcsRUFBRTlELFdBRHdCO0FBRTdCOEIsUUFBQUEsZ0JBRjZCO0FBRzdCa0MsUUFBQUEsWUFBWSxFQUFFbkM7QUFIZSxPQUF4QixDQUFQO0FBUko7QUFjRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhdXRoRGF0YU1hbmFnZXIgZnJvbSAnLi4vQWRhcHRlcnMvQXV0aCc7XG5pbXBvcnQgeyBQYXJzZVNlcnZlck9wdGlvbnMgfSBmcm9tICcuLi9PcHRpb25zJztcbmltcG9ydCB7IGxvYWRBZGFwdGVyIH0gZnJvbSAnLi4vQWRhcHRlcnMvQWRhcHRlckxvYWRlcic7XG5pbXBvcnQgZGVmYXVsdHMgZnJvbSAnLi4vZGVmYXVsdHMnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuLy8gQ29udHJvbGxlcnNcbmltcG9ydCB7IExvZ2dlckNvbnRyb2xsZXIgfSBmcm9tICcuL0xvZ2dlckNvbnRyb2xsZXInO1xuaW1wb3J0IHsgRmlsZXNDb250cm9sbGVyIH0gZnJvbSAnLi9GaWxlc0NvbnRyb2xsZXInO1xuaW1wb3J0IHsgSG9va3NDb250cm9sbGVyIH0gZnJvbSAnLi9Ib29rc0NvbnRyb2xsZXInO1xuaW1wb3J0IHsgVXNlckNvbnRyb2xsZXIgfSBmcm9tICcuL1VzZXJDb250cm9sbGVyJztcbmltcG9ydCB7IENhY2hlQ29udHJvbGxlciB9IGZyb20gJy4vQ2FjaGVDb250cm9sbGVyJztcbmltcG9ydCB7IExpdmVRdWVyeUNvbnRyb2xsZXIgfSBmcm9tICcuL0xpdmVRdWVyeUNvbnRyb2xsZXInO1xuaW1wb3J0IHsgQW5hbHl0aWNzQ29udHJvbGxlciB9IGZyb20gJy4vQW5hbHl0aWNzQ29udHJvbGxlcic7XG5pbXBvcnQgeyBQdXNoQ29udHJvbGxlciB9IGZyb20gJy4vUHVzaENvbnRyb2xsZXInO1xuaW1wb3J0IHsgUHVzaFF1ZXVlIH0gZnJvbSAnLi4vUHVzaC9QdXNoUXVldWUnO1xuaW1wb3J0IHsgUHVzaFdvcmtlciB9IGZyb20gJy4uL1B1c2gvUHVzaFdvcmtlcic7XG5pbXBvcnQgRGF0YWJhc2VDb250cm9sbGVyIGZyb20gJy4vRGF0YWJhc2VDb250cm9sbGVyJztcbmltcG9ydCBTY2hlbWFDYWNoZSBmcm9tICcuL1NjaGVtYUNhY2hlJztcblxuLy8gQWRhcHRlcnNcbmltcG9ydCB7IEdyaWRGU0J1Y2tldEFkYXB0ZXIgfSBmcm9tICcuLi9BZGFwdGVycy9GaWxlcy9HcmlkRlNCdWNrZXRBZGFwdGVyJztcbmltcG9ydCB7IFdpbnN0b25Mb2dnZXJBZGFwdGVyIH0gZnJvbSAnLi4vQWRhcHRlcnMvTG9nZ2VyL1dpbnN0b25Mb2dnZXJBZGFwdGVyJztcbmltcG9ydCB7IEluTWVtb3J5Q2FjaGVBZGFwdGVyIH0gZnJvbSAnLi4vQWRhcHRlcnMvQ2FjaGUvSW5NZW1vcnlDYWNoZUFkYXB0ZXInO1xuaW1wb3J0IHsgQW5hbHl0aWNzQWRhcHRlciB9IGZyb20gJy4uL0FkYXB0ZXJzL0FuYWx5dGljcy9BbmFseXRpY3NBZGFwdGVyJztcbmltcG9ydCBNb25nb1N0b3JhZ2VBZGFwdGVyIGZyb20gJy4uL0FkYXB0ZXJzL1N0b3JhZ2UvTW9uZ28vTW9uZ29TdG9yYWdlQWRhcHRlcic7XG5pbXBvcnQgUG9zdGdyZXNTdG9yYWdlQWRhcHRlciBmcm9tICcuLi9BZGFwdGVycy9TdG9yYWdlL1Bvc3RncmVzL1Bvc3RncmVzU3RvcmFnZUFkYXB0ZXInO1xuaW1wb3J0IFBhcnNlUHVzaEFkYXB0ZXIgZnJvbSAnQHBhcnNlL3B1c2gtYWRhcHRlcic7XG5pbXBvcnQgUGFyc2VHcmFwaFFMQ29udHJvbGxlciBmcm9tICcuL1BhcnNlR3JhcGhRTENvbnRyb2xsZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udHJvbGxlcnMob3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zKSB7XG4gIGNvbnN0IGxvZ2dlckNvbnRyb2xsZXIgPSBnZXRMb2dnZXJDb250cm9sbGVyKG9wdGlvbnMpO1xuICBjb25zdCBmaWxlc0NvbnRyb2xsZXIgPSBnZXRGaWxlc0NvbnRyb2xsZXIob3B0aW9ucyk7XG4gIGNvbnN0IHVzZXJDb250cm9sbGVyID0gZ2V0VXNlckNvbnRyb2xsZXIob3B0aW9ucyk7XG4gIGNvbnN0IHtcbiAgICBwdXNoQ29udHJvbGxlcixcbiAgICBoYXNQdXNoU2NoZWR1bGVkU3VwcG9ydCxcbiAgICBoYXNQdXNoU3VwcG9ydCxcbiAgICBwdXNoQ29udHJvbGxlclF1ZXVlLFxuICAgIHB1c2hXb3JrZXIsXG4gIH0gPSBnZXRQdXNoQ29udHJvbGxlcihvcHRpb25zKTtcbiAgY29uc3QgY2FjaGVDb250cm9sbGVyID0gZ2V0Q2FjaGVDb250cm9sbGVyKG9wdGlvbnMpO1xuICBjb25zdCBhbmFseXRpY3NDb250cm9sbGVyID0gZ2V0QW5hbHl0aWNzQ29udHJvbGxlcihvcHRpb25zKTtcbiAgY29uc3QgbGl2ZVF1ZXJ5Q29udHJvbGxlciA9IGdldExpdmVRdWVyeUNvbnRyb2xsZXIob3B0aW9ucyk7XG4gIGNvbnN0IGRhdGFiYXNlQ29udHJvbGxlciA9IGdldERhdGFiYXNlQ29udHJvbGxlcihvcHRpb25zLCBjYWNoZUNvbnRyb2xsZXIpO1xuICBjb25zdCBob29rc0NvbnRyb2xsZXIgPSBnZXRIb29rc0NvbnRyb2xsZXIob3B0aW9ucywgZGF0YWJhc2VDb250cm9sbGVyKTtcbiAgY29uc3QgYXV0aERhdGFNYW5hZ2VyID0gZ2V0QXV0aERhdGFNYW5hZ2VyKG9wdGlvbnMpO1xuICBjb25zdCBwYXJzZUdyYXBoUUxDb250cm9sbGVyID0gZ2V0UGFyc2VHcmFwaFFMQ29udHJvbGxlcihvcHRpb25zLCB7XG4gICAgZGF0YWJhc2VDb250cm9sbGVyLFxuICAgIGNhY2hlQ29udHJvbGxlcixcbiAgfSk7XG4gIHJldHVybiB7XG4gICAgbG9nZ2VyQ29udHJvbGxlcixcbiAgICBmaWxlc0NvbnRyb2xsZXIsXG4gICAgdXNlckNvbnRyb2xsZXIsXG4gICAgcHVzaENvbnRyb2xsZXIsXG4gICAgaGFzUHVzaFNjaGVkdWxlZFN1cHBvcnQsXG4gICAgaGFzUHVzaFN1cHBvcnQsXG4gICAgcHVzaFdvcmtlcixcbiAgICBwdXNoQ29udHJvbGxlclF1ZXVlLFxuICAgIGFuYWx5dGljc0NvbnRyb2xsZXIsXG4gICAgY2FjaGVDb250cm9sbGVyLFxuICAgIHBhcnNlR3JhcGhRTENvbnRyb2xsZXIsXG4gICAgbGl2ZVF1ZXJ5Q29udHJvbGxlcixcbiAgICBkYXRhYmFzZUNvbnRyb2xsZXIsXG4gICAgaG9va3NDb250cm9sbGVyLFxuICAgIGF1dGhEYXRhTWFuYWdlcixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvZ2dlckNvbnRyb2xsZXIoXG4gIG9wdGlvbnM6IFBhcnNlU2VydmVyT3B0aW9uc1xuKTogTG9nZ2VyQ29udHJvbGxlciB7XG4gIGNvbnN0IHtcbiAgICBhcHBJZCxcbiAgICBqc29uTG9ncyxcbiAgICBsb2dzRm9sZGVyLFxuICAgIHZlcmJvc2UsXG4gICAgbG9nTGV2ZWwsXG4gICAgbWF4TG9nRmlsZXMsXG4gICAgc2lsZW50LFxuICAgIGxvZ2dlckFkYXB0ZXIsXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBsb2dnZXJPcHRpb25zID0ge1xuICAgIGpzb25Mb2dzLFxuICAgIGxvZ3NGb2xkZXIsXG4gICAgdmVyYm9zZSxcbiAgICBsb2dMZXZlbCxcbiAgICBzaWxlbnQsXG4gICAgbWF4TG9nRmlsZXMsXG4gIH07XG4gIGNvbnN0IGxvZ2dlckNvbnRyb2xsZXJBZGFwdGVyID0gbG9hZEFkYXB0ZXIoXG4gICAgbG9nZ2VyQWRhcHRlcixcbiAgICBXaW5zdG9uTG9nZ2VyQWRhcHRlcixcbiAgICBsb2dnZXJPcHRpb25zXG4gICk7XG4gIHJldHVybiBuZXcgTG9nZ2VyQ29udHJvbGxlcihsb2dnZXJDb250cm9sbGVyQWRhcHRlciwgYXBwSWQsIGxvZ2dlck9wdGlvbnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlsZXNDb250cm9sbGVyKFxuICBvcHRpb25zOiBQYXJzZVNlcnZlck9wdGlvbnNcbik6IEZpbGVzQ29udHJvbGxlciB7XG4gIGNvbnN0IHtcbiAgICBhcHBJZCxcbiAgICBkYXRhYmFzZVVSSSxcbiAgICBmaWxlc0FkYXB0ZXIsXG4gICAgZGF0YWJhc2VBZGFwdGVyLFxuICAgIHByZXNlcnZlRmlsZU5hbWUsXG4gICAgZmlsZUtleSxcbiAgfSA9IG9wdGlvbnM7XG4gIGlmICghZmlsZXNBZGFwdGVyICYmIGRhdGFiYXNlQWRhcHRlcikge1xuICAgIHRocm93ICdXaGVuIHVzaW5nIGFuIGV4cGxpY2l0IGRhdGFiYXNlIGFkYXB0ZXIsIHlvdSBtdXN0IGFsc28gdXNlIGFuIGV4cGxpY2l0IGZpbGVzQWRhcHRlci4nO1xuICB9XG4gIGNvbnN0IGZpbGVzQ29udHJvbGxlckFkYXB0ZXIgPSBsb2FkQWRhcHRlcihmaWxlc0FkYXB0ZXIsICgpID0+IHtcbiAgICByZXR1cm4gbmV3IEdyaWRGU0J1Y2tldEFkYXB0ZXIoZGF0YWJhc2VVUkksIHt9LCBmaWxlS2V5KTtcbiAgfSk7XG4gIHJldHVybiBuZXcgRmlsZXNDb250cm9sbGVyKGZpbGVzQ29udHJvbGxlckFkYXB0ZXIsIGFwcElkLCB7XG4gICAgcHJlc2VydmVGaWxlTmFtZSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVc2VyQ29udHJvbGxlcihvcHRpb25zOiBQYXJzZVNlcnZlck9wdGlvbnMpOiBVc2VyQ29udHJvbGxlciB7XG4gIGNvbnN0IHsgYXBwSWQsIGVtYWlsQWRhcHRlciwgdmVyaWZ5VXNlckVtYWlscyB9ID0gb3B0aW9ucztcbiAgY29uc3QgZW1haWxDb250cm9sbGVyQWRhcHRlciA9IGxvYWRBZGFwdGVyKGVtYWlsQWRhcHRlcik7XG4gIHJldHVybiBuZXcgVXNlckNvbnRyb2xsZXIoZW1haWxDb250cm9sbGVyQWRhcHRlciwgYXBwSWQsIHtcbiAgICB2ZXJpZnlVc2VyRW1haWxzLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhY2hlQ29udHJvbGxlcihcbiAgb3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zXG4pOiBDYWNoZUNvbnRyb2xsZXIge1xuICBjb25zdCB7IGFwcElkLCBjYWNoZUFkYXB0ZXIsIGNhY2hlVFRMLCBjYWNoZU1heFNpemUgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGNhY2hlQ29udHJvbGxlckFkYXB0ZXIgPSBsb2FkQWRhcHRlcihcbiAgICBjYWNoZUFkYXB0ZXIsXG4gICAgSW5NZW1vcnlDYWNoZUFkYXB0ZXIsXG4gICAgeyBhcHBJZDogYXBwSWQsIHR0bDogY2FjaGVUVEwsIG1heFNpemU6IGNhY2hlTWF4U2l6ZSB9XG4gICk7XG4gIHJldHVybiBuZXcgQ2FjaGVDb250cm9sbGVyKGNhY2hlQ29udHJvbGxlckFkYXB0ZXIsIGFwcElkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcnNlR3JhcGhRTENvbnRyb2xsZXIoXG4gIG9wdGlvbnM6IFBhcnNlU2VydmVyT3B0aW9ucyxcbiAgY29udHJvbGxlckRlcHNcbik6IFBhcnNlR3JhcGhRTENvbnRyb2xsZXIge1xuICByZXR1cm4gbmV3IFBhcnNlR3JhcGhRTENvbnRyb2xsZXIoe1xuICAgIG1vdW50R3JhcGhRTDogb3B0aW9ucy5tb3VudEdyYXBoUUwsXG4gICAgLi4uY29udHJvbGxlckRlcHMsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QW5hbHl0aWNzQ29udHJvbGxlcihcbiAgb3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zXG4pOiBBbmFseXRpY3NDb250cm9sbGVyIHtcbiAgY29uc3QgeyBhbmFseXRpY3NBZGFwdGVyIH0gPSBvcHRpb25zO1xuICBjb25zdCBhbmFseXRpY3NDb250cm9sbGVyQWRhcHRlciA9IGxvYWRBZGFwdGVyKFxuICAgIGFuYWx5dGljc0FkYXB0ZXIsXG4gICAgQW5hbHl0aWNzQWRhcHRlclxuICApO1xuICByZXR1cm4gbmV3IEFuYWx5dGljc0NvbnRyb2xsZXIoYW5hbHl0aWNzQ29udHJvbGxlckFkYXB0ZXIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGl2ZVF1ZXJ5Q29udHJvbGxlcihcbiAgb3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zXG4pOiBMaXZlUXVlcnlDb250cm9sbGVyIHtcbiAgcmV0dXJuIG5ldyBMaXZlUXVlcnlDb250cm9sbGVyKG9wdGlvbnMubGl2ZVF1ZXJ5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFiYXNlQ29udHJvbGxlcihcbiAgb3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zLFxuICBjYWNoZUNvbnRyb2xsZXI6IENhY2hlQ29udHJvbGxlclxuKTogRGF0YWJhc2VDb250cm9sbGVyIHtcbiAgY29uc3Qge1xuICAgIGRhdGFiYXNlVVJJLFxuICAgIGRhdGFiYXNlT3B0aW9ucyxcbiAgICBjb2xsZWN0aW9uUHJlZml4LFxuICAgIHNjaGVtYUNhY2hlVFRMLFxuICAgIGVuYWJsZVNpbmdsZVNjaGVtYUNhY2hlLFxuICB9ID0gb3B0aW9ucztcbiAgbGV0IHsgZGF0YWJhc2VBZGFwdGVyIH0gPSBvcHRpb25zO1xuICBpZiAoXG4gICAgKGRhdGFiYXNlT3B0aW9ucyB8fFxuICAgICAgKGRhdGFiYXNlVVJJICYmIGRhdGFiYXNlVVJJICE9PSBkZWZhdWx0cy5kYXRhYmFzZVVSSSkgfHxcbiAgICAgIGNvbGxlY3Rpb25QcmVmaXggIT09IGRlZmF1bHRzLmNvbGxlY3Rpb25QcmVmaXgpICYmXG4gICAgZGF0YWJhc2VBZGFwdGVyXG4gICkge1xuICAgIHRocm93ICdZb3UgY2Fubm90IHNwZWNpZnkgYm90aCBhIGRhdGFiYXNlQWRhcHRlciBhbmQgYSBkYXRhYmFzZVVSSS9kYXRhYmFzZU9wdGlvbnMvY29sbGVjdGlvblByZWZpeC4nO1xuICB9IGVsc2UgaWYgKCFkYXRhYmFzZUFkYXB0ZXIpIHtcbiAgICBkYXRhYmFzZUFkYXB0ZXIgPSBnZXREYXRhYmFzZUFkYXB0ZXIoXG4gICAgICBkYXRhYmFzZVVSSSxcbiAgICAgIGNvbGxlY3Rpb25QcmVmaXgsXG4gICAgICBkYXRhYmFzZU9wdGlvbnNcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGRhdGFiYXNlQWRhcHRlciA9IGxvYWRBZGFwdGVyKGRhdGFiYXNlQWRhcHRlcik7XG4gIH1cbiAgcmV0dXJuIG5ldyBEYXRhYmFzZUNvbnRyb2xsZXIoXG4gICAgZGF0YWJhc2VBZGFwdGVyLFxuICAgIG5ldyBTY2hlbWFDYWNoZShjYWNoZUNvbnRyb2xsZXIsIHNjaGVtYUNhY2hlVFRMLCBlbmFibGVTaW5nbGVTY2hlbWFDYWNoZSlcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhvb2tzQ29udHJvbGxlcihcbiAgb3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zLFxuICBkYXRhYmFzZUNvbnRyb2xsZXI6IERhdGFiYXNlQ29udHJvbGxlclxuKTogSG9va3NDb250cm9sbGVyIHtcbiAgY29uc3QgeyBhcHBJZCwgd2ViaG9va0tleSB9ID0gb3B0aW9ucztcbiAgcmV0dXJuIG5ldyBIb29rc0NvbnRyb2xsZXIoYXBwSWQsIGRhdGFiYXNlQ29udHJvbGxlciwgd2ViaG9va0tleSk7XG59XG5cbmludGVyZmFjZSBQdXNoQ29udHJvbGxpbmcge1xuICBwdXNoQ29udHJvbGxlcjogUHVzaENvbnRyb2xsZXI7XG4gIGhhc1B1c2hTY2hlZHVsZWRTdXBwb3J0OiBib29sZWFuO1xuICBwdXNoQ29udHJvbGxlclF1ZXVlOiBQdXNoUXVldWU7XG4gIHB1c2hXb3JrZXI6IFB1c2hXb3JrZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQdXNoQ29udHJvbGxlcihcbiAgb3B0aW9uczogUGFyc2VTZXJ2ZXJPcHRpb25zXG4pOiBQdXNoQ29udHJvbGxpbmcge1xuICBjb25zdCB7IHNjaGVkdWxlZFB1c2gsIHB1c2ggfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgcHVzaE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBwdXNoKTtcbiAgY29uc3QgcHVzaFF1ZXVlT3B0aW9ucyA9IHB1c2hPcHRpb25zLnF1ZXVlT3B0aW9ucyB8fCB7fTtcbiAgaWYgKHB1c2hPcHRpb25zLnF1ZXVlT3B0aW9ucykge1xuICAgIGRlbGV0ZSBwdXNoT3B0aW9ucy5xdWV1ZU9wdGlvbnM7XG4gIH1cblxuICAvLyBQYXNzIHRoZSBwdXNoIG9wdGlvbnMgdG9vIGFzIGl0IHdvcmtzIHdpdGggdGhlIGRlZmF1bHRcbiAgY29uc3QgcHVzaEFkYXB0ZXIgPSBsb2FkQWRhcHRlcihcbiAgICBwdXNoT3B0aW9ucyAmJiBwdXNoT3B0aW9ucy5hZGFwdGVyLFxuICAgIFBhcnNlUHVzaEFkYXB0ZXIsXG4gICAgcHVzaE9wdGlvbnNcbiAgKTtcbiAgLy8gV2UgcGFzcyB0aGUgb3B0aW9ucyBhbmQgdGhlIGJhc2UgY2xhc3MgZm9yIHRoZSBhZGF0cGVyLFxuICAvLyBOb3RlIHRoYXQgcGFzc2luZyBhbiBpbnN0YW5jZSB3b3VsZCB3b3JrIHRvb1xuICBjb25zdCBwdXNoQ29udHJvbGxlciA9IG5ldyBQdXNoQ29udHJvbGxlcigpO1xuICBjb25zdCBoYXNQdXNoU3VwcG9ydCA9ICEhKHB1c2hBZGFwdGVyICYmIHB1c2gpO1xuICBjb25zdCBoYXNQdXNoU2NoZWR1bGVkU3VwcG9ydCA9IGhhc1B1c2hTdXBwb3J0ICYmIHNjaGVkdWxlZFB1c2ggPT09IHRydWU7XG5cbiAgY29uc3QgeyBkaXNhYmxlUHVzaFdvcmtlciB9ID0gcHVzaFF1ZXVlT3B0aW9ucztcblxuICBjb25zdCBwdXNoQ29udHJvbGxlclF1ZXVlID0gbmV3IFB1c2hRdWV1ZShwdXNoUXVldWVPcHRpb25zKTtcbiAgbGV0IHB1c2hXb3JrZXI7XG4gIGlmICghZGlzYWJsZVB1c2hXb3JrZXIpIHtcbiAgICBwdXNoV29ya2VyID0gbmV3IFB1c2hXb3JrZXIocHVzaEFkYXB0ZXIsIHB1c2hRdWV1ZU9wdGlvbnMpO1xuICB9XG4gIHJldHVybiB7XG4gICAgcHVzaENvbnRyb2xsZXIsXG4gICAgaGFzUHVzaFN1cHBvcnQsXG4gICAgaGFzUHVzaFNjaGVkdWxlZFN1cHBvcnQsXG4gICAgcHVzaENvbnRyb2xsZXJRdWV1ZSxcbiAgICBwdXNoV29ya2VyLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXV0aERhdGFNYW5hZ2VyKG9wdGlvbnM6IFBhcnNlU2VydmVyT3B0aW9ucykge1xuICBjb25zdCB7IGF1dGgsIGVuYWJsZUFub255bW91c1VzZXJzIH0gPSBvcHRpb25zO1xuICByZXR1cm4gYXV0aERhdGFNYW5hZ2VyKGF1dGgsIGVuYWJsZUFub255bW91c1VzZXJzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFiYXNlQWRhcHRlcihcbiAgZGF0YWJhc2VVUkksXG4gIGNvbGxlY3Rpb25QcmVmaXgsXG4gIGRhdGFiYXNlT3B0aW9uc1xuKSB7XG4gIGxldCBwcm90b2NvbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWRVUkkgPSB1cmwucGFyc2UoZGF0YWJhc2VVUkkpO1xuICAgIHByb3RvY29sID0gcGFyc2VkVVJJLnByb3RvY29sID8gcGFyc2VkVVJJLnByb3RvY29sLnRvTG93ZXJDYXNlKCkgOiBudWxsO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLyogKi9cbiAgfVxuICBzd2l0Y2ggKHByb3RvY29sKSB7XG4gICAgY2FzZSAncG9zdGdyZXM6JzpcbiAgICAgIHJldHVybiBuZXcgUG9zdGdyZXNTdG9yYWdlQWRhcHRlcih7XG4gICAgICAgIHVyaTogZGF0YWJhc2VVUkksXG4gICAgICAgIGNvbGxlY3Rpb25QcmVmaXgsXG4gICAgICAgIGRhdGFiYXNlT3B0aW9ucyxcbiAgICAgIH0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbmV3IE1vbmdvU3RvcmFnZUFkYXB0ZXIoe1xuICAgICAgICB1cmk6IGRhdGFiYXNlVVJJLFxuICAgICAgICBjb2xsZWN0aW9uUHJlZml4LFxuICAgICAgICBtb25nb09wdGlvbnM6IGRhdGFiYXNlT3B0aW9ucyxcbiAgICAgIH0pO1xuICB9XG59XG4iXX0=