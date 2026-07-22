/**
 * Combined Username + Password login page (login.ftl) with optional WebAuthn passkey support.
 * Styled after shadcn/ui's "login-02" block; the surrounding two-column shell lives in ../Template.tsx.
 */
import { useState } from "react";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useIsPasswordRevealed } from "keycloakify/tools/useIsPasswordRevealed";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { useScript } from "keycloakify/login/pages/Login.useScript";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { social, realm, url, usernameHidden, login, auth, registrationDisabled, messagesPerField, enableWebAuthnConditionalUI, authenticators } =
        kcContext;

    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const webAuthnButtonId = "authenticateWebAuthnButton";

    useScript({
        webAuthnButtonId,
        kcContext,
        i18n
    });

    const hasFieldError = messagesPerField.existsError("username", "password");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!hasFieldError}
            headerNode={msg("loginAccountTitle")}
            displayInfo={realm.password && realm.registrationAllowed && !registrationDisabled}
            infoNode={
                <FieldDescription>
                    {msg("noAccount")} <a href={url.registrationUrl}>{msg("doRegister")}</a>
                </FieldDescription>
            }
            socialProvidersNode={
                realm.password && social?.providers !== undefined && social.providers.length !== 0 ? (
                    <>
                        <FieldSeparator>{msg("identity-provider-login-label")}</FieldSeparator>
                        <Field>
                            <div className={social.providers.length > 3 ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
                                {social.providers.map(p => (
                                    <Button key={p.alias} variant="outline" render={<a id={`social-${p.alias}`} href={p.loginUrl} />}>
                                        {p.displayName}
                                    </Button>
                                ))}
                            </div>
                        </Field>
                    </>
                ) : undefined
            }
        >
            {realm.password && (
                <form
                    id="kc-form-login"
                    onSubmit={() => {
                        setIsLoginButtonDisabled(true);
                        return true;
                    }}
                    action={url.loginAction}
                    method="post"
                >
                    <FieldGroup>
                        {!usernameHidden && (
                            <Field data-invalid={hasFieldError || undefined}>
                                <FieldLabel htmlFor="username">
                                    {!realm.loginWithEmailAllowed
                                        ? msg("username")
                                        : !realm.registrationEmailAsUsername
                                          ? msg("usernameOrEmail")
                                          : msg("email")}
                                </FieldLabel>
                                <Input
                                    tabIndex={2}
                                    id="username"
                                    name="username"
                                    defaultValue={login.username ?? ""}
                                    type="text"
                                    autoFocus
                                    autoComplete={enableWebAuthnConditionalUI ? "username webauthn" : "username"}
                                    aria-invalid={hasFieldError}
                                />
                                {hasFieldError && (
                                    <FieldError>
                                        <span dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.getFirstError("username", "password")) }} />
                                    </FieldError>
                                )}
                            </Field>
                        )}

                        <Field data-invalid={(usernameHidden && hasFieldError) || undefined}>
                            <div className="flex items-center">
                                <FieldLabel htmlFor="password">{msg("password")}</FieldLabel>
                                {realm.resetPasswordAllowed && (
                                    <a tabIndex={6} href={url.loginResetCredentialsUrl} className="ml-auto text-sm underline-offset-4 hover:underline">
                                        {msg("doForgotPassword")}
                                    </a>
                                )}
                            </div>
                            <PasswordInput tabIndex={3} id="password" name="password" aria-invalid={hasFieldError} i18n={i18n} />
                            {usernameHidden && hasFieldError && (
                                <FieldError>
                                    <span dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.getFirstError("username", "password")) }} />
                                </FieldError>
                            )}
                        </Field>

                        {realm.rememberMe && !usernameHidden && (
                            <Field orientation="horizontal">
                                <label className="flex items-center gap-2 text-sm font-normal">
                                    <Checkbox tabIndex={5} id="rememberMe" name="rememberMe" defaultChecked={!!login.rememberMe} />
                                    {msg("rememberMe")}
                                </label>
                            </Field>
                        )}

                        <Field>
                            <input type="hidden" id="id-hidden-input" name="credentialId" value={auth.selectedCredential} />
                            <Button tabIndex={7} disabled={isLoginButtonDisabled} type="submit" id="kc-login">
                                {msgStr("doLogIn")}
                            </Button>
                        </Field>
                    </FieldGroup>
                </form>
            )}

            {enableWebAuthnConditionalUI && (
                <>
                    <form id="webauth" action={url.loginAction} method="post">
                        <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                        <input type="hidden" id="authenticatorData" name="authenticatorData" />
                        <input type="hidden" id="signature" name="signature" />
                        <input type="hidden" id="credentialId" name="credentialId" />
                        <input type="hidden" id="userHandle" name="userHandle" />
                        <input type="hidden" id="error" name="error" />
                    </form>

                    {authenticators !== undefined && authenticators.authenticators.length !== 0 && (
                        <form id="authn_select" className={kcClsx("kcFormClass")}>
                            {authenticators.authenticators.map((authenticator, i) => (
                                <input key={i} type="hidden" name="authn_use_chk" readOnly value={authenticator.credentialId} />
                            ))}
                        </form>
                    )}

                    <Button id={webAuthnButtonId} type="button" variant="outline" className="mt-4 w-full">
                        {msgStr("passkey-doAuthenticate")}
                    </Button>
                </>
            )}
        </Template>
    );
}

function PasswordInput(props: {
    id: string;
    name: string;
    tabIndex?: number;
    "aria-invalid": boolean;
    i18n: I18n;
}) {
    const { id, name, tabIndex, "aria-invalid": ariaInvalid, i18n } = props;

    const { msgStr } = i18n;

    const { isPasswordRevealed, toggleIsPasswordRevealed } = useIsPasswordRevealed({ passwordInputId: id });

    return (
        <div className="relative">
            <Input
                tabIndex={tabIndex}
                id={id}
                name={name}
                type="password"
                autoComplete="current-password"
                aria-invalid={ariaInvalid}
                className="pr-9"
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                aria-label={msgStr(isPasswordRevealed ? "hidePassword" : "showPassword")}
                aria-controls={id}
                onClick={toggleIsPasswordRevealed}
            >
                {isPasswordRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}
