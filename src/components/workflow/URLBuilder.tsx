import React, { useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { useVariablesContext } from "../../context/VariablesContext";
import { FiPlus, FiTrash2, FiCopy, FiCheck, FiEyeOff, FiArrowRight, FiInfo, FiGlobe } from "react-icons/fi";
import {
  Button,
  Input,
  IconButton,
  Textarea,
  Toggle,
  IconWrapper
} from "../ui";
import {
  PROTOCOL_OPTIONS,
  ENVIRONMENT_OPTIONS,
  SECTION_CONFIG,
  VARIABLE_STATUS_STYLES,
  BUTTON_VARIANTS,
  INPUT_PLACEHOLDERS,
  LABELS
} from "../../constants/urlBuilder";
import { useURLBuilder } from "../../hooks/useURLBuilder";

const URLBuilder: React.FC = () => {

  const {
    activeSession,
    openUnifiedManager,
    handleURLBuilderSubmit
  } = useAppContext();
  const { globalVariables } = useVariablesContext();

  // Use the URL builder hook
  const {
    protocol,
    domain,
    segments,
    sessionDescription,
    environment,
    builtUrl,
    copiedUrl,
    showPreview,
    setProtocol,
    setDomain,
    setSegments,
    setSessionDescription,
    setEnvironment,
    setShowPreview,
    handleSegmentAdd,
    handleSegmentRemove,
    copyToClipboard,
    getVariableValue,
    currentUrlData
  } = useURLBuilder();

  // Event handlers
  const handleSubmit = useCallback((): void => {
    handleURLBuilderSubmit(currentUrlData);
  }, [handleURLBuilderSubmit, currentUrlData]);





  const renderOptionButton = useCallback((
    options: typeof PROTOCOL_OPTIONS | typeof ENVIRONMENT_OPTIONS,
    selectedValue: string,
    onSelect: (value: string) => void,
    ringColor: string
  ) => {
    return options.map((option) => {
      const isSelected = selectedValue === option.id;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none group shadow-sm overflow-hidden
            bg-gradient-to-br ${isSelected ? option.selectedColor + ' border-transparent shadow-lg scale-105' : option.color + ' border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-md'}
            ${isSelected ? `ring-2 ring-offset-2 ${ringColor}` : ''}
          `}
          aria-pressed={isSelected}
        >
          <IconWrapper
            icon={option.icon}
            size="2xl"
            className="mb-1 filter drop-shadow-sm"
            variant="colored"
          />
          <span className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{option.label}</span>
          <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{option.description}</span>
          {isSelected && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          )}
        </button>
      );
    });
  }, []);

  // Early return for no active session
  if (!activeSession) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className={`overflow-hidden relative p-6 bg-gradient-to-r ${SECTION_CONFIG.header.bgGradient} rounded-2xl border border-blue-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full -translate-x-12 translate-y-12"></div>
          </div>

          <div className="flex relative items-center space-x-4">
            <div className={`p-3 bg-gradient-to-br ${SECTION_CONFIG.header.iconBgGradient} rounded-xl shadow-lg`}>
              <SECTION_CONFIG.header.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${SECTION_CONFIG.header.titleGradient} dark:from-blue-400 dark:to-indigo-400`}>
                {SECTION_CONFIG.header.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {SECTION_CONFIG.header.description}
              </p>
            </div>
          </div>
        </div>

        {/* No Active Session Warning */}
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center">
            <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
              <SECTION_CONFIG.header.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-300">
              You need to create or select an active session before building URLs.
              Please go to the Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                gradient
                onClick={() => window.history.back()}
                className="text-gray-700 dark:text-gray-300"
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                gradient
                onClick={() => {
                  // Open session manager modal on sessions tab
                  openUnifiedManager('sessions');
                }}
                className="text-white"
              >
                Create Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`overflow-hidden relative p-6 bg-gradient-to-r ${SECTION_CONFIG.header.bgGradient} rounded-2xl border border-blue-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative items-center space-x-4">
          <div className={`p-3 bg-gradient-to-br ${SECTION_CONFIG.header.iconBgGradient} rounded-xl shadow-lg`}>
            <SECTION_CONFIG.header.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${SECTION_CONFIG.header.titleGradient} dark:from-blue-400 dark:to-indigo-400`}>
              {SECTION_CONFIG.header.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {SECTION_CONFIG.header.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuration Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center mb-6 space-x-3">
            <div className={`p-2 bg-gradient-to-br ${SECTION_CONFIG.configuration.iconBgGradient} rounded-lg`}>
              <SECTION_CONFIG.configuration.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{SECTION_CONFIG.configuration.title}</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Protocol */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {LABELS.protocol}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {renderOptionButton(PROTOCOL_OPTIONS, protocol, setProtocol, 'ring-blue-400')}
              </div>
            </div>

            {/* Domain */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {LABELS.domain}
              </label>
              <div className="relative">
                {/* Domain Type Indicator */}
                <div className="absolute left-3 top-1/2 z-10 transform -translate-y-1/2">
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${domain.includes('{') && domain.includes('}')
                    ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/50 dark:to-purple-800/50 dark:text-purple-300'
                    : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300'
                    }`}>
                    {domain.includes('{') && domain.includes('}') ? (
                      <>
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                        <span>Variable</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>Static</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Enhanced Input */}
                <div className="overflow-hidden relative bg-gradient-to-r from-white via-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm transition-all duration-200 dark:border-gray-600 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:shadow-md">
                  <Input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder={INPUT_PLACEHOLDERS.domain}
                    fullWidth
                    data-testid="urlbuilder-domain"
                    className="py-3 pr-12 pl-24 font-mono text-sm placeholder-gray-500 text-gray-900 bg-transparent border-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-400"
                  />

                  {/* Globe Icon */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <FiGlobe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                {/* Domain Suggestions */}
                {domain === '' && (
                  <div className="overflow-hidden absolute right-0 left-0 top-full z-20 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-600">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-600">
                      <h4 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Options</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Choose a common domain pattern</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {[
                        { label: 'Use Base URL Variable', value: '{base_url}', icon: '🔗', description: 'Dynamic base URL from variables' },
                        { label: 'Localhost Development', value: 'localhost:3000', icon: '🏠', description: 'Local development server' },
                        { label: 'API Subdomain', value: 'api.example.com', icon: '🌐', description: 'API endpoint subdomain' },
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setDomain(suggestion.value)}
                          className="flex items-center p-2 space-x-3 w-full text-left rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <IconWrapper
                            icon={suggestion.icon}
                            size="lg"
                            variant="colored"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{suggestion.label}</div>
                            <div className="text-xs text-gray-500 truncate dark:text-gray-400">{suggestion.description}</div>
                          </div>
                          <code className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded dark:text-blue-400 dark:bg-blue-900/20">
                            {suggestion.value}
                          </code>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variable Value Preview */}
                {domain === '{base_url}' && globalVariables?.['base_url'] && (
                  <div className="absolute right-0 left-0 top-full p-3 mt-2 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 shadow-md dark:from-green-900/20 dark:to-green-800/20 dark:border-green-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Current Value:</span>
                      <code className="px-2 py-1 text-sm text-green-800 bg-green-100 rounded dark:text-green-200 dark:bg-green-900/30">
                        {globalVariables['base_url']}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Environment */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {LABELS.environment}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {renderOptionButton(ENVIRONMENT_OPTIONS, environment, setEnvironment, 'ring-green-400')}
              </div>
            </div>
          </div>

          {/* Session Description */}
          <div className="mt-6">
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {LABELS.sessionDescription}
            </label>
            <Textarea
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder={INPUT_PLACEHOLDERS.sessionDescription}
              rows={3}
              fullWidth
            />
          </div>
        </div>

        {/* Path Segments Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-gradient-to-br ${SECTION_CONFIG.pathSegments.iconBgGradient} rounded-lg`}>
                <SECTION_CONFIG.pathSegments.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{SECTION_CONFIG.pathSegments.title}</h3>
            </div>
            <Button
              variant={BUTTON_VARIANTS.addSegment.variant}
              icon={FiPlus}
              onClick={handleSegmentAdd}
              data-testid="urlbuilder-add-segment"
              gradient
              className="text-white"
            >
              {LABELS.addSegment}
            </Button>
          </div>

          {segments.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600">
              <SECTION_CONFIG.pathSegments.icon className="mx-auto mb-4 w-12 h-12 text-gray-400 dark:text-gray-500" />
              <p className="mb-4 text-gray-500 dark:text-gray-400">{LABELS.noSegments}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{LABELS.noSegmentsDescription}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="grid gap-4 items-center md:grid-cols-12">
                    {/* Segment Type Toggle */}
                    <div className="md:col-span-2">
                      <Toggle
                        checked={segment.isDynamic}
                        onChange={(checked) => {
                          const newSegments = [...segments];
                          newSegments[index] = {
                            ...segment,
                            isDynamic: checked,
                            value: checked ? "" : segment.value,
                            paramName: checked ? segment.paramName : ""
                          };
                          setSegments(newSegments);
                        }}
                        label={segment.isDynamic ? "Variable" : "Static"}
                        size="sm"
                        colorScheme="blue"
                        position="right"
                        data-testid={`urlbuilder-segment-toggle-${index}`}
                      />
                    </div>

                    {/* Segment Value/Parameter Name */}
                    <div className="md:col-span-4">
                      {segment.isDynamic ? (
                        <Input
                          type="text"
                          value={segment.paramName}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index] = {
                              ...segment,
                              paramName: e.target.value
                            };
                            setSegments(newSegments);
                          }}
                          placeholder={INPUT_PLACEHOLDERS.dynamicSegment}
                          fullWidth
                          data-testid={`urlbuilder-segment-paramName-${index}`}
                        />
                      ) : (
                        <Input
                          type="text"
                          value={segment.value}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index] = {
                              ...segment,
                              value: e.target.value
                            };
                            setSegments(newSegments);
                          }}
                          placeholder={INPUT_PLACEHOLDERS.staticSegment}
                          fullWidth
                          data-testid={`urlbuilder-segment-value-${index}`}
                        />
                      )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4">
                      <Input
                        type="text"
                        value={segment.description ?? ""}
                        onChange={(e) => {
                          const newSegments = [...segments];
                          newSegments[index] = {
                            ...segment,
                            description: e.target.value
                          };
                          setSegments(newSegments);
                        }}
                        placeholder={INPUT_PLACEHOLDERS.description}
                        fullWidth
                        data-testid={`urlbuilder-segment-description-${index}`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2">
                      <IconButton
                        icon={FiTrash2}
                        variant={BUTTON_VARIANTS.removeSegment.variant}
                        size={BUTTON_VARIANTS.removeSegment.size}
                        onClick={() => handleSegmentRemove(index)}
                        title="Remove segment"
                        data-testid={`urlbuilder-remove-segment-${index}`}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URL Preview Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-gradient-to-br ${SECTION_CONFIG.urlPreview.iconBgGradient} rounded-lg`}>
                <SECTION_CONFIG.urlPreview.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{SECTION_CONFIG.urlPreview.title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <IconButton
                icon={showPreview ? FiEyeOff : SECTION_CONFIG.urlPreview.icon}
                variant={BUTTON_VARIANTS.togglePreview.variant}
                onClick={() => setShowPreview(!showPreview)}
                title={showPreview ? "Hide preview" : "Show preview"}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              />
              <IconButton
                icon={copiedUrl ? FiCheck : FiCopy}
                variant={BUTTON_VARIANTS.copyUrl.variant}
                onClick={copyToClipboard}
                title="Copy URL"
                data-testid="urlbuilder-copy-url"
                className={`${copiedUrl ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} hover:text-blue-600 dark:hover:text-blue-400`}
              />
            </div>
          </div>

          {showPreview && (
            <div className="space-y-4">
              {/* Generated URL */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.generatedUrl}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{LABELS.clickToCopy}</span>
                </div>
                <div
                  onClick={copyToClipboard}
                  className="p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer dark:bg-gray-600 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                >
                  <code className="text-sm text-gray-900 break-all dark:text-gray-100">
                    {builtUrl}
                  </code>
                </div>
              </div>

              {/* Variable Values */}
              {(segments.some((s) => s.isDynamic) || domain === "{base_url}") && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                  <div className="flex items-center mb-3 space-x-2">
                    <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{LABELS.variableValues}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {/* Show base_url variable if it's being used */}
                    {domain === "{base_url}" && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg dark:bg-gray-700">
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                          base_url:
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${globalVariables?.['base_url']
                          ? VARIABLE_STATUS_STYLES.set
                          : VARIABLE_STATUS_STYLES.notSet
                          }`}>
                          {globalVariables?.['base_url'] || "Not set"}
                        </span>
                      </div>
                    )}
                    {/* Show segment variables */}
                    {segments
                      .filter((s) => s.isDynamic && s.paramName)
                      .map((segment, i) => {
                        const value = getVariableValue(segment.paramName, environment) || "Not set";
                        return (
                          <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg dark:bg-gray-700">
                            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                              {segment.paramName}:
                            </span>
                            <span className={`text-sm px-2 py-1 rounded ${value === "Not set"
                              ? VARIABLE_STATUS_STYLES.notSet
                              : VARIABLE_STATUS_STYLES.set
                              }`}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant={BUTTON_VARIANTS.submit.variant}
            size={BUTTON_VARIANTS.submit.size}
            gradient
            icon={FiArrowRight}
            iconPosition="right"
            onClick={handleSubmit}
            data-testid="urlbuilder-submit"
            className="text-white"
          >
            Continue to Request Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default URLBuilder;
