defmodule KinoStlViewer.MixProject do
  use Mix.Project

  @version "0.1.0"
  @description "STL file viewer for Livebook"

  def project do
    [
      app: :kino_stl_viewer,
      version: @version,
      description: @description,
      elixir: "~> 1.17",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      docs: docs(),
      package: package()
    ]
  end

  def application do
    []
  end

  defp deps do
    [
      {:kino, "~> 0.14"},
      {:ex_doc, "~> 0.30", only: :dev, runtime: false}
    ]
  end

  defp docs do
    [
      main: "usage",
      source_url: "https://github.com/bamorim/kino_stl_viewer",
      source_ref: "v#{@version}",
      extras: ["guides/usage.livemd"]
    ]
  end

  defp package do
    [
      licenses: ["Apache-2.0"],
      links: %{
        "GitHub" => "https://github.com/bamorim/kino_stl_viewer"
      }
    ]
  end
end
