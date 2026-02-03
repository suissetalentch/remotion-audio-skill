/**
 * Code Generator - Generate ready-to-use component code from wizard config
 */

import { ResolvedConfig } from './resolve-presets';

export interface GenerateOptions {
  componentName?: string;
  includeImports?: boolean;
  textPlaceholder?: string;
}

/**
 * Generates a complete React component using remotion-audio-skill.
 *
 * @param config - The resolved configuration from the wizard
 * @param options - Code generation options
 * @returns A string containing the complete TSX component code
 *
 * @example
 * const code = generateComponentCode(config, {
 *   componentName: 'MyVideo',
 *   textPlaceholder: 'Your narration text here...'
 * });
 */
export function generateComponentCode(
  config: ResolvedConfig,
  options: GenerateOptions = {}
): string {
  const {
    componentName = 'MyVideo',
    includeImports = true,
    textPlaceholder = 'Your narration text here...',
  } = options;

  const imports = includeImports ? generateImports(config) : '';
  const component = generateComponent(config, componentName, textPlaceholder);

  return `${imports}${component}`;
}

function generateImports(config: ResolvedConfig): string {
  const remotionImports = ['AbsoluteFill'];
  const skillImports = ['VoiceOver'];

  if (config.music.enabled) {
    skillImports.push('BackgroundMusic');
  }

  if (config.captions.enabled) {
    skillImports.push('AutoCaption');
  }

  // Always need useVoiceOverRef for captions or ducking
  if (config.captions.enabled || config.music.ducking) {
    skillImports.push('useVoiceOverRef');
  }

  return `import { ${remotionImports.join(', ')} } from 'remotion';
import { ${skillImports.join(', ')} } from 'remotion-audio-skill';

`;
}

function generateComponent(
  config: ResolvedConfig,
  componentName: string,
  textPlaceholder: string
): string {
  const needsVoiceRef = config.captions.enabled || config.music.ducking;

  const voiceRefLine = needsVoiceRef
    ? '  const voiceRef = useVoiceOverRef();\n\n'
    : '';

  const voiceOverProps = buildVoiceOverProps(config, needsVoiceRef);
  const backgroundMusicJsx = config.music.enabled
    ? buildBackgroundMusicJsx(config, needsVoiceRef)
    : '';
  const captionsJsx = config.captions.enabled
    ? buildCaptionsJsx(config)
    : '';

  return `export const ${componentName}: React.FC = () => {
${voiceRefLine}  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
${backgroundMusicJsx}
      <VoiceOver
${voiceOverProps}        text="${textPlaceholder}"
      />
${captionsJsx}
    </AbsoluteFill>
  );
};
`;
}

function buildVoiceOverProps(config: ResolvedConfig, hasRef: boolean): string {
  const lines: string[] = [];

  if (hasRef) {
    lines.push('        ref={voiceRef}');
  }

  if (config.voice.preset) {
    lines.push(`        preset="${config.voice.preset}"`);
  }

  if (config.voice.voiceId) {
    lines.push(`        voiceId="${config.voice.voiceId}"`);
  }

  lines.push(`        language="${config.voice.language}"`);

  return lines.join('\n') + '\n';
}

function buildBackgroundMusicJsx(config: ResolvedConfig, hasVoiceRef: boolean): string {
  const lines: string[] = [];

  lines.push('      <BackgroundMusic');

  if (config.music.preset) {
    lines.push(`        preset="${config.music.preset}"`);
  }

  lines.push('        volume={0.3}');
  lines.push('        loop');
  lines.push('        fadeInFrames={30}');
  lines.push('        fadeOutFrames={60}');

  if (config.music.ducking && config.music.duckingConfig && hasVoiceRef) {
    lines.push('        ducking={{');
    lines.push('          enabled: true,');
    lines.push('          triggerRef: voiceRef,');
    lines.push(`          duckTo: ${config.music.duckingConfig.duckTo},`);
    lines.push(`          attackFrames: ${config.music.duckingConfig.attackFrames},`);
    lines.push(`          releaseFrames: ${config.music.duckingConfig.releaseFrames},`);
    lines.push('        }}');
  }

  lines.push('      />');
  lines.push('');

  return lines.join('\n');
}

function buildCaptionsJsx(config: ResolvedConfig): string {
  if (!config.captions.enabled || !config.captions.style) {
    return '';
  }

  return `
      <AutoCaption
        audioRef={voiceRef}
        style="${config.captions.style}"
        position="bottom"
        fontSize={48}
        fontColor="#FFFFFF"
        highlightColor="#FFD700"
      />
`;
}

/**
 * Generates a minimal configuration snippet (without full component)
 */
export function generateConfigSnippet(config: ResolvedConfig): string {
  const lines: string[] = [];

  lines.push('// Voice configuration');
  lines.push(`const voiceConfig = {`);
  if (config.voice.preset) {
    lines.push(`  preset: '${config.voice.preset}',`);
  }
  if (config.voice.voiceId) {
    lines.push(`  voiceId: '${config.voice.voiceId}',`);
  }
  lines.push(`  language: '${config.voice.language}',`);
  lines.push(`};`);
  lines.push('');

  if (config.music.enabled) {
    lines.push('// Music configuration');
    lines.push(`const musicConfig = {`);
    if (config.music.preset) {
      lines.push(`  preset: '${config.music.preset}',`);
    }
    lines.push(`  volume: 0.3,`);
    lines.push(`  loop: true,`);

    if (config.music.ducking && config.music.duckingConfig) {
      lines.push(`  ducking: {`);
      lines.push(`    enabled: true,`);
      lines.push(`    duckTo: ${config.music.duckingConfig.duckTo},`);
      lines.push(`    attackFrames: ${config.music.duckingConfig.attackFrames},`);
      lines.push(`    releaseFrames: ${config.music.duckingConfig.releaseFrames},`);
      lines.push(`  },`);
    }

    lines.push(`};`);
    lines.push('');
  }

  if (config.captions.enabled) {
    lines.push('// Caption configuration');
    lines.push(`const captionConfig = {`);
    lines.push(`  style: '${config.captions.style}',`);
    lines.push(`  position: 'bottom',`);
    lines.push(`  fontSize: 48,`);
    lines.push(`};`);
  }

  return lines.join('\n');
}

/**
 * Generates props object that can be spread into components
 */
export function generatePropsObject(config: ResolvedConfig): {
  voiceOverProps: Record<string, unknown>;
  backgroundMusicProps?: Record<string, unknown>;
  autoCaptionProps?: Record<string, unknown>;
} {
  const voiceOverProps: Record<string, unknown> = {
    language: config.voice.language,
  };

  if (config.voice.preset) {
    voiceOverProps.preset = config.voice.preset;
  }

  if (config.voice.voiceId) {
    voiceOverProps.voiceId = config.voice.voiceId;
  }

  let backgroundMusicProps: Record<string, unknown> | undefined;
  if (config.music.enabled) {
    backgroundMusicProps = {
      volume: 0.3,
      loop: true,
      fadeInFrames: 30,
      fadeOutFrames: 60,
    };

    if (config.music.preset) {
      backgroundMusicProps.preset = config.music.preset;
    }

    if (config.music.ducking && config.music.duckingConfig) {
      backgroundMusicProps.ducking = {
        enabled: true,
        duckTo: config.music.duckingConfig.duckTo,
        attackFrames: config.music.duckingConfig.attackFrames,
        releaseFrames: config.music.duckingConfig.releaseFrames,
      };
    }
  }

  let autoCaptionProps: Record<string, unknown> | undefined;
  if (config.captions.enabled && config.captions.style) {
    autoCaptionProps = {
      style: config.captions.style,
      position: 'bottom',
      fontSize: 48,
      fontColor: '#FFFFFF',
      highlightColor: '#FFD700',
    };
  }

  return {
    voiceOverProps,
    backgroundMusicProps,
    autoCaptionProps,
  };
}
