import { useEffect } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import { KeyRound } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";

export default function Template(props: TemplateProps<KcContext, I18n>) {
    if (props.kcContext.pageId === "login.ftl") {
        return <LoginTemplate {...props} />;
    }

    return <DefaultTemplate {...props} />;
}

/**
 * Redesigned shell for login.ftl, matching shadcn's "login-02" block
 * Every other page keeps the stock Keycloakify/PatternFly template below.
 */
function LoginTemplate(props: TemplateProps<KcContext, I18n>) {
    const {
        displayInfo = false,
        displayMessage = true,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        documentTitle,
        bodyClassName,
        kcContext,
        i18n,
        children
    } = props;

    const {
        msg,
        msgStr,
        currentLanguage,
        enabledLanguages,
    } = i18n;

    const { realm, auth, url, message, isAppInitiatedAction } = kcContext;

    useEffect(() => {
        document.title = documentTitle ?? msgStr("loginTitle", realm.displayName || realm.name);
    }, []);

    useSetClassName({ qualifiedName: "html", className: undefined });
    useSetClassName({ qualifiedName: "body", className: bodyClassName ?? "bg-background text-foreground" });

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss: false });

    if (!isReadyToRender) {
        return null;
    }

    const isShowingAttemptedUsername = auth !== undefined && auth.showUsername && !auth.showResetCredentials;

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex items-center justify-between gap-2">
                    <a href="/" className="flex items-center gap-2 font-medium">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <KeyRound className="size-4" />
                        </div>
                        <span dangerouslySetInnerHTML={{ __html: kcSanitize(realm.displayNameHtml || realm.name) }} />
                    </a>
                    {enabledLanguages.length > 1 && (
                        <LocaleSwitcher currentLanguage={currentLanguage} enabledLanguages={enabledLanguages} label={msgStr("languages")} />
                    )}
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        {isShowingAttemptedUsername ? (
                            <div className="mb-6 flex flex-col items-center gap-1 text-center text-sm">
                                <span className="font-medium">{auth!.attemptedUsername}</span>
                                <a
                                    href={url.loginRestartFlowUrl}
                                    className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                                >
                                    {msg("restartLoginTooltip")}
                                </a>
                            </div>
                        ) : (
                            headerNode && <h1 className="mb-6 text-center text-2xl font-bold">{headerNode}</h1>
                        )}

                        {displayMessage && message !== undefined && (message.type !== "warning" || !isAppInitiatedAction) && (
                            <div
                                role="alert"
                                className={clsx(
                                    "mb-4 rounded-lg border px-3 py-2 text-sm",
                                    message.type === "error" && "border-destructive/50 bg-destructive/10 text-destructive",
                                    message.type === "warning" &&
                                        "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                    message.type === "success" &&
                                        "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                                    message.type === "info" && "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                                )}
                                dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }}
                            />
                        )}

                        {children}

                        {auth !== undefined && auth.showTryAnotherWayLink && (
                            <form id="kc-select-try-another-way-form" action={url.loginAction} method="post" className="mt-4 text-center text-sm">
                                <input type="hidden" name="tryAnotherWay" value="on" />
                                <a
                                    href="#"
                                    className="underline underline-offset-4 hover:text-primary"
                                    onClick={event => {
                                        event.preventDefault();
                                        (event.currentTarget.closest("form") as HTMLFormElement).requestSubmit();
                                    }}
                                >
                                    {msg("doTryAnotherWay")}
                                </a>
                            </form>
                        )}

                        {socialProvidersNode}

                        {displayInfo && <div className="mt-4 text-center text-sm text-muted-foreground">{infoNode}</div>}
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <img src="2.jpg" alt="" className="absolute inset-0 size-full object-cover" />
            </div>
        </div>
    );
}

function LocaleSwitcher(props: {
    currentLanguage: I18n["currentLanguage"];
    enabledLanguages: I18n["enabledLanguages"];
    label: string;
}) {
    const { currentLanguage, enabledLanguages, label } = props;

    return (
        <Select
            defaultValue={currentLanguage.languageTag}
            onValueChange={languageTag => {
                const href = enabledLanguages.find(lang => lang.languageTag === languageTag)?.href;
                if (href) {
                    window.location.href = href;
                }
            }}
        >
            <SelectTrigger aria-label={label} size="sm" className="text-foreground">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {enabledLanguages.map(({ languageTag, label }) => (
                    <SelectItem key={languageTag} value={languageTag}>
                        {label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/** Stock Keycloakify template, used for every page other than login.ftl. */
function DefaultTemplate(props: TemplateProps<KcContext, I18n>) {
    const {
        displayInfo = false,
        displayMessage = true,
        displayRequiredFields = false,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        documentTitle,
        bodyClassName,
        kcContext,
        i18n,
        doUseDefaultCss,
        classes,
        children
    } = props;

    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });

    const { msg, msgStr, currentLanguage, enabledLanguages } = i18n;

    const { realm, auth, url, message, isAppInitiatedAction } = kcContext;

    useEffect(() => {
        document.title = documentTitle ?? msgStr("loginTitle", realm.displayName || realm.name);
    }, []);

    useSetClassName({
        qualifiedName: "html",
        className: kcClsx("kcHtmlClass")
    });

    useSetClassName({
        qualifiedName: "body",
        className: bodyClassName ?? kcClsx("kcBodyClass")
    });

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

    if (!isReadyToRender) {
        return null;
    }

    return (
        <div className={kcClsx("kcLoginClass")}>
            <div id="kc-header" className={kcClsx("kcHeaderClass")}>
                <div id="kc-header-wrapper" className={kcClsx("kcHeaderWrapperClass")}>
                    {msg("loginTitleHtml", realm.displayNameHtml || realm.name)}
                </div>
            </div>
            <div className={kcClsx("kcFormCardClass")}>
                <header className={kcClsx("kcFormHeaderClass")}>
                    {enabledLanguages.length > 1 && (
                        <div className={kcClsx("kcLocaleMainClass")} id="kc-locale">
                            <div id="kc-locale-wrapper" className={kcClsx("kcLocaleWrapperClass")}>
                                <div id="kc-locale-dropdown" className={clsx("menu-button-links", kcClsx("kcLocaleDropDownClass"))}>
                                    <button
                                        tabIndex={1}
                                        id="kc-current-locale-link"
                                        aria-label={msgStr("languages")}
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                        aria-controls="language-switch1"
                                    >
                                        {currentLanguage.label}
                                    </button>
                                    <ul
                                        role="menu"
                                        tabIndex={-1}
                                        aria-labelledby="kc-current-locale-link"
                                        aria-activedescendant=""
                                        id="language-switch1"
                                        className={kcClsx("kcLocaleListClass")}
                                    >
                                        {enabledLanguages.map(({ languageTag, label, href }, i) => (
                                            <li key={languageTag} className={kcClsx("kcLocaleListItemClass")} role="none">
                                                <a role="menuitem" id={`language-${i + 1}`} className={kcClsx("kcLocaleItemClass")} href={href}>
                                                    {label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    {(() => {
                        const node = !(auth !== undefined && auth.showUsername && !auth.showResetCredentials) ? (
                            <h1 id="kc-page-title">{headerNode}</h1>
                        ) : (
                            <div id="kc-username" className={kcClsx("kcFormGroupClass")}>
                                <label id="kc-attempted-username">{auth.attemptedUsername}</label>
                                <a id="reset-login" href={url.loginRestartFlowUrl} aria-label={msgStr("restartLoginTooltip")}>
                                    <div className="kc-login-tooltip">
                                        <i className={kcClsx("kcResetFlowIcon")}></i>
                                        <span className="kc-tooltip-text">{msg("restartLoginTooltip")}</span>
                                    </div>
                                </a>
                            </div>
                        );

                        if (displayRequiredFields) {
                            return (
                                <div className={kcClsx("kcContentWrapperClass")}>
                                    <div className={clsx(kcClsx("kcLabelWrapperClass"), "subtitle")}>
                                        <span className="subtitle">
                                            <span className="required">*</span>
                                            {msg("requiredFields")}
                                        </span>
                                    </div>
                                    <div className="col-md-10">{node}</div>
                                </div>
                            );
                        }

                        return node;
                    })()}
                </header>
                <div id="kc-content">
                    <div id="kc-content-wrapper">
                        {/* App-initiated actions should not see warning messages about the need to complete the action during login. */}
                        {displayMessage && message !== undefined && (message.type !== "warning" || !isAppInitiatedAction) && (
                            <div
                                className={clsx(
                                    `alert-${message.type}`,
                                    kcClsx("kcAlertClass"),
                                    `pf-m-${message?.type === "error" ? "danger" : message.type}`
                                )}
                            >
                                <div className="pf-c-alert__icon">
                                    {message.type === "success" && <span className={kcClsx("kcFeedbackSuccessIcon")}></span>}
                                    {message.type === "warning" && <span className={kcClsx("kcFeedbackWarningIcon")}></span>}
                                    {message.type === "error" && <span className={kcClsx("kcFeedbackErrorIcon")}></span>}
                                    {message.type === "info" && <span className={kcClsx("kcFeedbackInfoIcon")}></span>}
                                </div>
                                <span
                                    className={kcClsx("kcAlertTitleClass")}
                                    dangerouslySetInnerHTML={{
                                        __html: kcSanitize(message.summary)
                                    }}
                                />
                            </div>
                        )}
                        {children}
                        {auth !== undefined && auth.showTryAnotherWayLink && (
                            <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                                <div className={kcClsx("kcFormGroupClass")}>
                                    <input type="hidden" name="tryAnotherWay" value="on" />
                                    <a
                                        href="#"
                                        id="try-another-way"
                                        onClick={event => {
                                            document.forms["kc-select-try-another-way-form" as never].requestSubmit();
                                            event.preventDefault();
                                            return false;
                                        }}
                                    >
                                        {msg("doTryAnotherWay")}
                                    </a>
                                </div>
                            </form>
                        )}
                        {socialProvidersNode}
                        {displayInfo && (
                            <div id="kc-info" className={kcClsx("kcSignUpClass")}>
                                <div id="kc-info-wrapper" className={kcClsx("kcInfoAreaWrapperClass")}>
                                    {infoNode}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
