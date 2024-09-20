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
           # pkgs.llvmPackages.libclang
           # pkgs.llvmPackages.stdenv
          llvmPackages.libcxxStdenv
          libclang
          cmake
          gcc14
          pkg-config
          libcec
          glibc_multi
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][holonix:\w]\$\[\033[0m\] '
          export LIBCLANG_PATH="${pkgs.libclang.lib}/lib";

          # From: https://github.com/NixOS/nixpkgs/blob/1fab95f5190d087e66a3502481e34e15d62090aa/pkgs/applications/networking/browsers/firefox/common.nix#L247-L253
          # Set C flags for Rust's bindgen program. Unlike ordinary C
          # compilation, bindgen does not invoke $CC directly. Instead it
          # uses LLVM's libclang. To make sure all necessary flags are
          # included we need to look in a few places.
          export BINDGEN_EXTRA_CLANG_ARGS="$(< ${pkgs.stdenv.cc}/nix-support/libc-crt1-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/libc-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/cc-cflags) \
            $(< ${pkgs.stdenv.cc}/nix-support/libcxx-cxxflags) \
            ${pkgs.lib.optionalString pkgs.stdenv.cc.isClang "
              -idirafter ${pkgs.stdenv.cc.cc}/lib/clang/${pkgs.lib.getVersion pkgs.stdenv.cc.cc}/include"} \
            ${pkgs.lib.optionalString pkgs.stdenv.cc.isGNU "
              -isystem ${pkgs.glibc_multi.dev}/include/gnu
              -isystem ${pkgs.stdenv.cc.cc}/include/c++/${pkgs.lib.getVersion pkgs.stdenv.cc.cc} 
              -isystem ${pkgs.stdenv.cc.cc}/include/c++/${pkgs.lib.getVersion pkgs.stdenv.cc.cc}/${pkgs.stdenv.hostPlatform.config} 
              -idirafter ${pkgs.stdenv.cc.cc}/lib/gcc/${pkgs.stdenv.hostPlatform.config}/${pkgs.pkgs.lib.getVersion pkgs.stdenv.cc.cc}/include"
             } \
          "

          # export BINDGEN_EXTRA_CLANG_ARGS=" \
          #   -B/nix/store/k7zgvzp2r31zkg9xqgjim7mbknryv6bs-glibc-2.39-52/lib/  \
          #   -idirafter /nix/store/fwh4fxd747m0py3ib3s5abamia9nrf90-glibc-2.39-52-dev/include   \
          #   -idirafter /nix/store/14c6s4xzhy14i2b05s00rjns2j93gzz4-gcc-13.2.0/lib/gcc/x86_64-unknown-linux-gnu/13.2.0/include-fixed  \
          #   -B/nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib/lib \
          #   -isystem /nix/store/impr9iqscwbaph51qdw3pl547yknd76w-glibc-multi-2.39-52-dev/include
          #   -isystem /nix/store/14c6s4xzhy14i2b05s00rjns2j93gzz4-gcc-13.2.0/include/c++/13.2.0 \
          #   -isystem /nix/store/14c6s4xzhy14i2b05s00rjns2j93gzz4-gcc-13.2.0/include/c++/13.2.0/x86_64-unknown-linux-gnu \
          #   -idirafter /nix/store/14c6s4xzhy14i2b05s00rjns2j93gzz4-gcc-13.2.0/lib/gcc/x86_64-unknown-linux-gnu/13.2.0/include \
          #   "
        '';
        
      };
    };
  };
}
