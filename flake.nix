{
  inputs = {
    p2p-shipyard.url = "github:darksoil-studio/p2p-shipyard";
    nixpkgs.follows = "holonix/nixpkgs";

    versions.url = "github:holochain/holochain?dir=versions/weekly";
    holonix.url = "github:holochain/holochain";
    holonix.inputs.versions.follows = "versions";
  };

  outputs = inputs@{ holonix, ... }:
    holonix.inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      # provide a dev shell for all systems that the holonix flake supports
      systems = builtins.attrNames holonix.devShells;

      perSystem = { inputs', config, system, pkgs, ... }:
        {
          devShells.default = pkgs.mkShell {
            inputsFrom = [
              inputs'.p2p-shipyard.devShells.holochainTauriDev holonix.devShells.${system}.holochainBinaries ];
            packages = with pkgs; [
              # add further packages from nixpkgs
              # nodejs
              pkgs.llvmPackages.bintools
            ];
            shellHook = ''
                export LIBCLANG_PATH="${pkgs.llvmPackages.libclang.lib}/lib"
            '';
          };
          devShells.androidDev = pkgs.mkShell {
            inputsFrom = [
              inputs'.p2p-shipyard.devShells.holochainTauriAndroidDev holonix.devShells.${system}.holochainBinaries ];
            packages = with pkgs; [
              # add further packages from nixpkgs
              # nodejs
              pkgs.llvmPackages.bintools
            ];
            shellHook = ''
                export LIBCLANG_PATH="${pkgs.llvmPackages.libclang.lib}/lib"
            '';
          };
        };
    };
}
