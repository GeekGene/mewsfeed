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
          libclang
          glibc_multi
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][holonix:\w]\$\[\033[0m\] ';
          export LIBCLANG_PATH="${pkgs.libclang.lib}/lib";

          # From: https://github.com/NixOS/nixpkgs/blob/1fab95f5190d087e66a3502481e34e15d62090aa/pkgs/applications/networking/browsers/firefox/common.nix#L247-L253
          # Set C flags for Rust's bindgen program. Unlike ordinary C
          # compilation, bindgen does not invoke $CC directly. Instead it
          # uses LLVM's libclang. To make sure all necessary flags are
          # included we need to look in a few places.
          export BINDGEN_EXTRA_CLANG_ARGS=" \
            $(< ${pkgs.stdenv.cc}/nix-support/libc-crt1-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/libc-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/cc-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/libcxx-cxxflags) \
            ${pkgs.lib.optionalString pkgs.stdenv.cc.isClang " \
              -idirafter ${pkgs.stdenv.cc.cc}/lib/clang/${pkgs.lib.getVersion pkgs.stdenv.cc.cc}/include"
            } \
            ${pkgs.lib.optionalString pkgs.stdenv.cc.isGNU " \
              -isystem ${pkgs.glibc_multi.dev}/include \
              -isystem ${pkgs.stdenv.cc.cc}/include/c++/${pkgs.lib.getVersion pkgs.stdenv.cc.cc} \
              -isystem ${pkgs.stdenv.cc.cc}/include/c++/${pkgs.lib.getVersion pkgs.stdenv.cc.cc}/${pkgs.stdenv.hostPlatform.config} \
              -idirafter ${pkgs.stdenv.cc.cc}/lib/gcc/${pkgs.stdenv.hostPlatform.config}/${pkgs.pkgs.lib.getVersion pkgs.stdenv.cc.cc}/include"
            }";
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
          libclang
          glibc_multi
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][holonix:\w]\$\[\033[0m\] ';

          export LIBCLANG_PATH="${pkgs.libclang.lib}/lib";

          # From: https://github.com/NixOS/nixpkgs/blob/1fab95f5190d087e66a3502481e34e15d62090aa/pkgs/applications/networking/browsers/firefox/common.nix#L247-L253
          # Set C flags for Rust's bindgen program. Unlike ordinary C
          # compilation, bindgen does not invoke $CC directly. Instead it
          # uses LLVM's libclang. To make sure all necessary flags are
          # included we need to look in a few places.
          export BINDGEN_EXTRA_CLANG_ARGS=" \
            $(< ${pkgs.stdenv.cc}/nix-support/libc-crt1-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/libc-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/cc-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/libcxx-cxxflags) \
            ${pkgs.lib.optionalString pkgs.stdenv.cc.isClang " \
              -idirafter ${pkgs.stdenv.cc.cc}/lib/clang/${pkgs.lib.getVersion pkgs.stdenv.cc.cc}/include"
            } \
            ${pkgs.lib.optionalString pkgs.stdenv.cc.isGNU " \
              -isystem ${pkgs.glibc_multi.dev}/include \
              -isystem ${pkgs.stdenv.cc.cc}/include/c++/${pkgs.lib.getVersion pkgs.stdenv.cc.cc} \
              -isystem ${pkgs.stdenv.cc.cc}/include/c++/${pkgs.lib.getVersion pkgs.stdenv.cc.cc}/${pkgs.stdenv.hostPlatform.config} \
              -idirafter ${pkgs.stdenv.cc.cc}/lib/gcc/${pkgs.stdenv.hostPlatform.config}/${pkgs.pkgs.lib.getVersion pkgs.stdenv.cc.cc}/include"
            }";
        '';
      };
    };
  };
}
