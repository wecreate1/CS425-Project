export default [
    {
      entry: "./app.js",
      output: {
        
        filename: "bundle.js"
      },
      module: {
        rules: [
            {
                test: /\.(?:js|mjs|cjs)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: "defaults" }]
                        ]
                    }
                }
            }
        ] 
      },
    },
    {
      entry: "./consent.js",
      output: {
        
        filename: "consent-bundle.js"
      },
      module: {
        rules: [
            {
                test: /\.(?:js|mjs|cjs)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: "defaults" }]
                        ]
                    }
                }
            }
        ] 
      },
    }
  ];
  