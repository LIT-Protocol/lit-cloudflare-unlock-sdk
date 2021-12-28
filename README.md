# Lit-CloudFlare Unlock SDK

## Build

Add/Change version at `.env`

```
version=0.0.1
```

Then, run the build command to minify `lit-unlock.js` and `lit-unlock.css`

```
yarn build
``` 

The output will be stored at `./dist` based on its version number

```
./dist/0.0.1/lit-unlock.min.js
./dist/0.0.1/lit-unlock.min.css
```

## Deploy
run

```
yarn deploy

// which is equivalent to
yarn build && vercel ./dist --prod
```

> This SDK is deployed to Vercel.app