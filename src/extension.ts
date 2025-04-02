import * as vscode from 'vscode';


//MARK: HELPERS


function getCustomExcludeKeys(
    all: { [key: string]: any },
    defaults: { [key: string]: any }
): { [key: string]: any } {
    return Object.fromEntries(
        Object.entries(all).filter(([key]) => !(key in defaults))
    );
}

function getCoreKey(key: string): string {
    const lastColonIndex = key.lastIndexOf(':');
    return lastColonIndex !== -1 ? key.substring(lastColonIndex + 1) : key;
}


//MARK: FUNCTIONS


async function applyVisibilityMode() {
    const thisExtensionsConfig = vscode.workspace.getConfiguration('fileVisibilityToggle');
    const visibilityEnabled = thisExtensionsConfig.get<boolean>('fullVisibilityMode') ?? false;
    const config = vscode.workspace.getConfiguration('files');

    await finalizeExclusionSettings(config, vscode.ConfigurationTarget.Workspace, visibilityEnabled);
    await finalizeExclusionSettings(config, vscode.ConfigurationTarget.Global, visibilityEnabled);

    return visibilityEnabled;
}

async function finalizeExclusionSettings(
    config: vscode.WorkspaceConfiguration,
    target: vscode.ConfigurationTarget,
    visibilityEnabled: boolean
) {
    const inspected = config.inspect<{ [key: string]: any }>('exclude');
    if (!inspected) return;
    const defaults = inspected.defaultValue || {};
    const existing = target === vscode.ConfigurationTarget.Workspace
        ? inspected.workspaceValue
        : inspected.globalValue;
    const custom = existing ? getCustomExcludeKeys(existing, defaults) : {};

    const thisExtensionsConfig = vscode.workspace.getConfiguration('fileVisibilityToggle');
    const inspectedProtected = thisExtensionsConfig.inspect<string[]>('protectedKeys');
    const protectedRaw = target === vscode.ConfigurationTarget.Workspace
        ? inspectedProtected?.workspaceValue
        : inspectedProtected?.globalValue;
    const protectedKeys = new Set(protectedRaw || []);

    const newDefaults: { [key: string]: any } = {};

    for (const key of Object.keys(defaults)) {
        if (protectedKeys.has(key)) {
            newDefaults[key] = existing?.[key] ?? defaults[key];
        } else {
            newDefaults[key] = visibilityEnabled ? false : defaults[key];
        }
    }

    const newCustom: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(custom)) {
        const unprefixedKey = getCoreKey(key);
        const isProtected = protectedKeys.has(unprefixedKey);

        if (visibilityEnabled) {
            if (!isProtected && value === true) {
                const finalKey = key.startsWith('IGNORE:') ? key : `IGNORE:${key}`;
                newCustom[finalKey] = value;
            } else {
                newCustom[unprefixedKey] = value;
            }
        } else {
            newCustom[unprefixedKey] = value;
        }        
    }

    const finalConfig: { [key: string]: any } = {
        ...newDefaults,
        ...newCustom
    };

    await config.update('exclude', finalConfig, target);

    const inspectedAlsoToggle = thisExtensionsConfig.inspect<boolean>('alsoToggleGitIgnoreExclusion');
    const alsoToggle = target === vscode.ConfigurationTarget.Workspace
        ? inspectedAlsoToggle?.workspaceValue
        : inspectedAlsoToggle?.globalValue;

    if (alsoToggle === true) {
        await vscode.workspace
            .getConfiguration('explorer')
            .update('excludeGitIgnore', !visibilityEnabled, target);
    }

}


//MARK: ACTIVATE


export function activate(context: vscode.ExtensionContext) {
    const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusItem.command = 'fileVisibilityToggle.toggleVisibility';
    statusItem.name = 'Visibility of Excluded Files';
    statusItem.tooltip = 'Visibility of Excluded Files';
    context.subscriptions.push(statusItem);

    const updateStatusBar = (visibilityEnabled: boolean) => {
        const icon = visibilityEnabled ? '$(filter-filled)' : '$(filter)';
        statusItem.text = `${icon} Show Exclusions`;
        statusItem.show();
    };

    const syncStatusBar = async () => {
        const visibilityEnabled = await applyVisibilityMode();
        updateStatusBar(visibilityEnabled);
    };

    syncStatusBar();

    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('fileVisibilityToggle.fullVisibilityMode')) {
            syncStatusBar();
        }
    });

    const toggleVisibility = vscode.commands.registerCommand('fileVisibilityToggle.toggleVisibility', async () => {
        const thisExtensionsConfig = vscode.workspace.getConfiguration('fileVisibilityToggle');
        const showAllMode = thisExtensionsConfig.get<boolean>('fullVisibilityMode') ?? false;
        const oppositeVisibilityMode = !showAllMode;
        await thisExtensionsConfig.update('fullVisibilityMode', oppositeVisibilityMode, vscode.ConfigurationTarget.Global);
    });
    context.subscriptions.push(toggleVisibility);

    const openSettings = vscode.commands.registerCommand('fileVisibilityToggle.openSettings', async () => {
        const settingsToShow = [
            '@id:files.exclude',
            '@id:explorer.excludeGitIgnore',
        ];
        const ext = vscode.extensions.getExtension('upward-solutions.file-visibility-toggle');
        if (ext) {
            const props = ext.packageJSON?.contributes?.configuration?.properties;
            if (props) {
                const ownSettingIds = Object.keys(props).map(id => `@id:${id}`);
                settingsToShow.push(...ownSettingIds);
            }
        }
        await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            settingsToShow.join(' ')
        );
    });
    context.subscriptions.push(openSettings);
}


//MARK: DEACTIVATE


export async function deactivate() {
    const config = vscode.workspace.getConfiguration('fileVisibilityToggle');
    await config.update('fullVisibilityMode', false, vscode.ConfigurationTarget.Global);
    await applyVisibilityMode();
}

