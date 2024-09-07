defmodule KinoStlViewer do
  @moduledoc """
  Renders an STL file using [`react-stl-viewer`](https://www.npmjs.com/package/react-stl-viewer)
  """

  use Kino.JS,
    assets_path: "lib/assets/stl_viewer/build"

  use Kino.JS.Live

  @doc "Creates a new STL Viewer"
  def new do
    Kino.JS.Live.new(__MODULE__, nil)
  end

  @doc """
  Loads a STL file into the viewer.

  The data is expected to be the binary data of the file itself, so if the file is 
  in disk, read it first and then call this function.
  """
  def load(kino, data) do
    Kino.JS.Live.cast(kino, {:load, data})
  end

  @doc false
  @impl true
  def handle_connect(ctx) do
    {:ok, nil, ctx}
  end

  @doc false
  @impl true
  def handle_cast({:load, data}, ctx) do
    broadcast_event(ctx, "load", {:binary, %{}, data})
    {:noreply, ctx}
  end
end
