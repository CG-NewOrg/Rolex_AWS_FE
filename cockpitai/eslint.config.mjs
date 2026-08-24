import fioriTools from '@sap-ux/eslint-plugin-fiori-tools';

export default [
    {
        ignores: ["dist/**", "webapp/lib/**", "webapp/xlxslibs/**"]
    },
    ...fioriTools.configs.recommended
];
