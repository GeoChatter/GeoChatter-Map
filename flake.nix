{
  description = "GeoChatter Map v2 dev environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit system; };
      });
    in
    {
      devShells = forAllSystems ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            git
            (pkgs.writeShellScriptBin "dev" ''
              set -euo pipefail
              cd "$(git rev-parse --show-toplevel)"
              echo "Starting GeoChatter Map v2 dev servers..."

              (cd server && npm run dev) &
              SERVER_PID=$!
              (cd client && npm run dev) &
              CLIENT_PID=$!

              cleanup() {
                trap - EXIT INT TERM
                echo "Shutting down dev servers..."
                kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
                wait "$SERVER_PID" 2>/dev/null || true
                wait "$CLIENT_PID" 2>/dev/null || true
              }
              trap cleanup EXIT INT TERM

              wait
            '')
          ];

          shellHook = ''
            echo "GeoChatter Map v2 dev shell"
            echo "Run 'dev' to start the backend (port 3000) and frontend (port 5173)"
          '';
        };
      });
    };
}
