{
  description = "Flake for Holochain app development";

  inputs = {
    holonix.url = "github:holochain/holonix?ref=main";
    p2p-shipyard.url = "github:mattyg/p2p-shipyard?ref=feat/wasm-interpreter-feature-flag";

    nixpkgs.follows = "holonix/nixpkgs";
    flake-parts.follows = "holonix/flake-parts";
  };

  outputs = inputs@{ flake-parts, ... }: flake-parts.lib.mkFlake { inherit inputs; } {
    systems = builtins.attrNames inputs.holonix.devShells;
    perSystem = { inputs', pkgs, 
          lib,
          stdenv, ... }: {
      formatter = pkgs.nixpkgs-fmt;

      devShells.default = pkgs.mkShell {
        inputsFrom = [ 
          inputs'.holonix.devShells
          inputs'.p2p-shipyard.devShells.holochainTauriDev
        ];

        packages = (with inputs'.holonix.packages; [
          holochain
          lair-keystore
          hc-launch
          hc-scaffold
          hn-introspect
        ]) ++ (with pkgs; [
          nodejs_20 # For UI development
          binaryen # For WASM optimisation
          # Add any other packages you need here
          pkgs.llvmPackages.bintools
          pkgs.llvmPackages.libclang
          pkgs.cmake
          pkgs.gcc8
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][holonix:\w]\$\[\033[0m\] '
        '';
      };

      devShells.androidDev = pkgs.mkShell {
        inputsFrom = [
          inputs'.holonix.devShells
          inputs'.p2p-shipyard.devShells.holochainTauriAndroidDev
        ];
        
        packages = (with inputs'.holonix.packages; [
          holochain
          lair-keystore
          hc-launch
          hc-scaffold
          hn-introspect
        ]) ++ (with pkgs; [
          nodejs_20 # For UI development
          binaryen # For WASM optimisation
          # Add any other packages you need here
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][holonix:\w]\$\[\033[0m\] ';
        '';
      };
    };
  };
}
