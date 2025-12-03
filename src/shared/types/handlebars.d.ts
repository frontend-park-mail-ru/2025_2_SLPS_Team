declare module "*.hbs" {
  const template: (context: any) => string;
  export default template;
}

declare module '*.css';
